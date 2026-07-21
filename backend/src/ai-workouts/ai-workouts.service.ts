import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExercisesService } from '../exercises/exercises.service';

// Un ejercicio tal como lo devuelve ExercisesService.search()
type CatalogExercise = {
  exerciseId: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl: string;
};

export type GeneratedWorkout = {
  name: string;
  exercises: CatalogExercise[];
  detectedGroups: string[];
  // false = Gemini no respondio y se uso la seleccion por defecto
  generatedByAi: boolean;
};

// Grupos musculares que entiende la app.
// "canonical" es la palabra que se le pasa a ExercisesService.search(), que ya
// sabe traducirla al bodyPart/target de ExerciseDB. "synonyms" es solo para
// detectar el grupo dentro del texto libre del usuario.
const MUSCLE_GROUPS: Array<{ canonical: string; synonyms: string[] }> = [
  { canonical: 'pecho', synonyms: ['pecho', 'pectoral'] },
  { canonical: 'espalda', synonyms: ['espalda', 'dorsal'] },
  { canonical: 'piernas', synonyms: ['pierna', 'cuadriceps', 'femoral'] },
  { canonical: 'hombros', synonyms: ['hombro', 'deltoide'] },
  { canonical: 'brazos', synonyms: ['brazo'] },
  { canonical: 'biceps', synonyms: ['bicep'] },
  { canonical: 'triceps', synonyms: ['tricep'] },
  { canonical: 'abdominales', synonyms: ['abdomen', 'abdominal', 'core'] },
  { canonical: 'gluteos', synonyms: ['gluteo', 'cola'] },
  { canonical: 'pantorrillas', synonyms: ['pantorrilla', 'gemelo'] },
];

// Cuantos ejercicios por grupo cuando el usuario no aclara una cantidad.
const DEFAULT_PER_GROUP = 3;
// Tope de seguridad para que un pedido absurdo no genere una rutina enorme.
const MAX_TOTAL_EXERCISES = 20;
// Cuantos candidatos reales traemos de cada grupo para que el modelo elija.
const CANDIDATES_PER_GROUP = 25;

// Ejercicios de referencia para PRINCIPIANTES por grupo (nombres en espanol).
// Se le pasan a Gemini como guia: cuando el usuario pide nivel principiante,
// prioriza los equivalentes del catalogo a estos ejercicios simples/de maquina.
const BEGINNER_REFERENCE: Record<string, string[]> = {
  pecho: [
    'Press de banca',
    'Press en maquina (Chest Press)',
    'Aperturas en maquina (Pec Deck)',
    'Flexiones (Push-ups)',
  ],
  espalda: [
    'Jalon al pecho (Lat Pulldown)',
    'Remo sentado en polea',
    'Remo en maquina',
    'Dominadas asistidas',
  ],
  hombros: [
    'Press de hombros en maquina',
    'Press con mancuernas',
    'Elevaciones laterales',
    'Aperturas para deltoides posterior',
  ],
  piernas: [
    'Prensa de piernas',
    'Sentadillas',
    'Extension de cuadriceps',
    'Curl femoral',
  ],
  gluteos: [
    'Hip Thrust',
    'Patada de gluteo en maquina o polea',
    'Peso muerto rumano',
    'Abduccion de cadera en maquina',
  ],
  biceps: [
    'Curl con mancuernas',
    'Curl con barra EZ',
    'Curl predicador',
    'Curl en polea',
  ],
  triceps: [
    'Extension en polea (Pushdown)',
    'Extension por encima de la cabeza',
    'Fondos en banco',
    'Maquina de triceps',
  ],
  abdominales: [
    'Plancha',
    'Crunch en maquina',
    'Crunch en polea',
    'Elevacion de rodillas',
  ],
};

// Palabras que indican que el usuario quiere una rutina para principiantes.
const BEGINNER_HINTS = [
  'principiante',
  'principiantes',
  'basico',
  'basica',
  'novato',
  'iniciante',
  'empezando',
  'recien empiezo',
];

// flash-lite: alcanza de sobra para elegir de una lista, responde en ~2s
// (los modelos grandes tardan ~25s) y tiene una cuota gratuita mas generosa.
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
// La capa gratuita de Gemini tarda ~25s por llamada, por eso el timeout es alto.
const GEMINI_TIMEOUT_MS = 60000;
// La capa gratuita devuelve 503 (sobrecargado) muy seguido, pero falla rapido,
// asi que reintentar es barato y sube mucho la tasa de exito.
const GEMINI_MAX_ATTEMPTS = 4;
const GEMINI_RETRY_DELAY_MS = 1500;

// Forma exacta que le pedimos a Gemini que devuelva.
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    nombreRutina: { type: 'STRING' },
    ejercicios: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { exerciseId: { type: 'STRING' } },
        required: ['exerciseId'],
      },
    },
  },
  required: ['nombreRutina', 'ejercicios'],
};

type GeminiChoice = { name: string; ids: string[] };

@Injectable()
export class AiWorkoutsService {
  private readonly logger = new Logger(AiWorkoutsService.name);

  constructor(
    private readonly exercisesService: ExercisesService,
    private readonly configService: ConfigService,
  ) {}

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Detecta que grupos musculares menciona el usuario en su mensaje.
  detectGroups(prompt: string): string[] {
    const normalized = this.normalizeText(prompt);
    return MUSCLE_GROUPS.filter((group) =>
      group.synonyms.some((synonym) => normalized.includes(synonym)),
    ).map((group) => group.canonical);
  }

  // Detecta si el usuario pidio nivel principiante.
  private isBeginner(prompt: string): boolean {
    const normalized = this.normalizeText(prompt);
    return BEGINNER_HINTS.some((hint) => normalized.includes(hint));
  }

  // Trae los ejercicios reales de cada grupo. Estos son los unicos que
  // se pueden elegir: el modelo nunca inventa ejercicios.
  private async buildCatalog(
    groups: string[],
  ): Promise<Record<string, CatalogExercise[]>> {
    const catalog: Record<string, CatalogExercise[]> = {};

    await Promise.all(
      groups.map(async (group) => {
        try {
          catalog[group] = await this.exercisesService.search(
            group,
            CANDIDATES_PER_GROUP,
          );
        } catch (err) {
          this.logger.warn(
            `No se pudieron traer ejercicios de "${group}": ${
              err instanceof Error ? err.message : 'error desconocido'
            }`,
          );
          catalog[group] = [];
        }
      }),
    );

    return catalog;
  }

  private buildName(groups: string[]): string {
    if (groups.length === 1) return `Rutina de ${groups[0]}`;
    const last = groups[groups.length - 1];
    const rest = groups.slice(0, -1).join(', ');
    return `Rutina de ${rest} y ${last}`;
  }

  // Arma el texto que ve el modelo: el pedido original y el catalogo real.
  private buildGeminiPrompt(
    prompt: string,
    groups: string[],
    catalog: Record<string, CatalogExercise[]>,
    beginner: boolean,
  ): string {
    const catalogText = groups
      .map((group) => {
        const lines = (catalog[group] ?? [])
          .map((e) => `${e.exerciseId} | ${e.name} | equipo: ${e.equipment}`)
          .join('\n');
        return `## Grupo "${group}"\n${lines}`;
      })
      .join('\n\n');

    const lines = [
      `Sos un entrenador armando una rutina de gimnasio.`,
      ``,
      `Pedido del usuario: "${prompt}"`,
      ``,
      `Catalogo de ejercicios disponibles (solo podes elegir de aca):`,
      catalogText,
      ``,
      `Instrucciones:`,
      `- Respeta la CANTIDAD de ejercicios que pide el usuario para cada grupo.`,
      `  Por ejemplo "3 de pecho y 2 de hombro" = 3 de pecho y 2 de hombro.`,
      `  Si no aclara una cantidad para un grupo, elegi ${DEFAULT_PER_GROUP}.`,
      `- Dentro de cada grupo, elegi ejercicios VARIADOS entre si (distinto`,
      `  equipamiento y angulo/movimiento). Evita variantes casi iguales.`,
      `- Solo podes usar exerciseId que aparezcan en el catalogo. No inventes ids.`,
      `- Devolve "ejercicios" en el orden en que irian en la rutina`,
      `  (agrupados por grupo muscular).`,
      `- "nombreRutina": un nombre corto en espanol para la rutina.`,
    ];

    if (beginner) {
      const beginnerRef = groups
        .filter((group) => BEGINNER_REFERENCE[group])
        .map((group) => `  - ${group}: ${BEGINNER_REFERENCE[group].join(', ')}`)
        .join('\n');

      lines.push(
        ``,
        `IMPORTANTE: el usuario pide nivel PRINCIPIANTE. Priorizá ejercicios`,
        `simples, de maquina o basicos. Evita variantes inestables o avanzadas`,
        `(bosu, banco de equilibrio, a un solo brazo/pierna, con salto, etc.).`,
      );

      if (beginnerRef) {
        lines.push(
          `Como referencia, estos son ejercicios apropiados para principiantes;`,
          `elegi del catalogo los equivalentes mas parecidos:`,
          beginnerRef,
        );
      }
    }

    return lines.join('\n');
  }

  // Llama a Gemini. Devuelve null ante cualquier problema (sin key, timeout,
  // error HTTP, JSON invalido): el que llama decide el fallback.
  private async pickWithGemini(
    prompt: string,
    groups: string[],
    catalog: Record<string, CatalogExercise[]>,
    beginner: boolean,
  ): Promise<GeminiChoice | null> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY no configurada: uso seleccion por defecto');
      return null;
    }

    const body = JSON.stringify({
      contents: [
        {
          parts: [
            { text: this.buildGeminiPrompt(prompt, groups, catalog, beginner) },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
          body,
        });

        // 429 (limite) y 5xx (sobrecarga) son transitorios: reintentamos.
        if (response.status === 429 || response.status >= 500) {
          this.logger.warn(
            `Gemini HTTP ${response.status} (intento ${attempt}/${GEMINI_MAX_ATTEMPTS})`,
          );
          if (attempt < GEMINI_MAX_ATTEMPTS) {
            await this.sleep(GEMINI_RETRY_DELAY_MS * attempt);
            continue;
          }
          return null;
        }

        if (!response.ok) {
          // 4xx que no sea 429: es un problema nuestro, no sirve reintentar.
          this.logger.warn(`Gemini devolvio HTTP ${response.status}`);
          return null;
        }

        const data = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          this.logger.warn('Gemini devolvio una respuesta sin contenido');
          return null;
        }

        const parsed = JSON.parse(text) as {
          nombreRutina?: string;
          ejercicios?: Array<{ exerciseId?: string }>;
        };

        const ids = (parsed.ejercicios ?? [])
          .map((e) => e.exerciseId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0);

        if (ids.length === 0) return null;

        this.logger.log(`Gemini respondio OK en el intento ${attempt}`);
        return { name: parsed.nombreRutina?.trim() || '', ids };
      } catch (err) {
        this.logger.warn(
          `Fallo la llamada a Gemini (intento ${attempt}/${GEMINI_MAX_ATTEMPTS}): ${
            err instanceof Error ? err.message : 'error desconocido'
          }`,
        );
        if (attempt < GEMINI_MAX_ATTEMPTS) {
          await this.sleep(GEMINI_RETRY_DELAY_MS * attempt);
          continue;
        }
        return null;
      }
    }

    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Valida los ids elegidos por el modelo contra el catalogo real: descarta los
  // que no existan (el modelo no puede meter ejercicios inventados) y los
  // repetidos, respetando el orden y la cantidad que eligio la IA.
  private validateChosen(
    catalog: Record<string, CatalogExercise[]>,
    chosenIds: string[],
  ): CatalogExercise[] {
    const byId = new Map<string, CatalogExercise>();
    for (const group of Object.keys(catalog)) {
      for (const exercise of catalog[group]) {
        if (!byId.has(exercise.exerciseId)) byId.set(exercise.exerciseId, exercise);
      }
    }

    const seen = new Set<string>();
    const result: CatalogExercise[] = [];
    for (const id of chosenIds) {
      const exercise = byId.get(id);
      if (exercise && !seen.has(id)) {
        seen.add(id);
        result.push(exercise);
      }
    }

    return result.slice(0, MAX_TOTAL_EXERCISES);
  }

  // Seleccion de respaldo cuando Gemini no responde: DEFAULT_PER_GROUP por
  // grupo, sin repetir ejercicios entre grupos que se solapan.
  private fallbackSelection(
    groups: string[],
    catalog: Record<string, CatalogExercise[]>,
  ): CatalogExercise[] {
    const used = new Set<string>();

    return groups.flatMap((group) => {
      const selected = (catalog[group] ?? [])
        .filter((e) => !used.has(e.exerciseId))
        .slice(0, DEFAULT_PER_GROUP);
      selected.forEach((e) => used.add(e.exerciseId));
      return selected;
    });
  }

  async generate(prompt: string): Promise<GeneratedWorkout> {
    const groups = this.detectGroups(prompt);

    if (groups.length === 0) {
      throw new BadRequestException(
        'No reconoci ningun grupo muscular en tu pedido. Proba nombrando alguno, por ejemplo: "una rutina de pecho y hombro".',
      );
    }

    const catalog = await this.buildCatalog(groups);

    if (groups.every((group) => (catalog[group] ?? []).length === 0)) {
      throw new BadRequestException(
        'No se encontraron ejercicios para los grupos musculares pedidos. Intenta de nuevo en unos minutos.',
      );
    }

    const beginner = this.isBeginner(prompt);
    const choice = await this.pickWithGemini(prompt, groups, catalog, beginner);

    // La IA sirve si respondio Y sus ejercicios pasaron la validacion.
    const aiExercises = choice ? this.validateChosen(catalog, choice.ids) : [];
    const usedAi = aiExercises.length > 0;

    // Si la IA fallo, igual devolvemos una rutina valida de respaldo.
    const exercises = usedAi
      ? aiExercises
      : this.fallbackSelection(groups, catalog);

    return {
      name: (usedAi && choice?.name) || this.buildName(groups),
      exercises,
      detectedGroups: groups,
      generatedByAi: usedAi,
    };
  }
}
