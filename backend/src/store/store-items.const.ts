export interface StoreItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  description: string;
}

export const STORE_ITEMS: StoreItem[] = [
  { id: 'item_01', name: 'Guante de Boxeo',    icon: '🥊', price: 5,   description: 'Accesorio de entrenamiento' },
  { id: 'item_02', name: 'Pesa 1kg',           icon: '🏋️', price: 10,  description: 'Coleccionable de fuerza' },
  { id: 'item_03', name: 'Cinta Deportiva',    icon: '🎽', price: 15,  description: 'Ropa deportiva' },
  { id: 'item_04', name: 'Botella de Agua',    icon: '💧', price: 20,  description: 'Hidratacion esencial' },
  { id: 'item_05', name: 'Toalla de Gym',      icon: '🧺', price: 30,  description: 'Toalla de entrenamiento' },
  { id: 'item_06', name: 'Munequera',          icon: '💪', price: 40,  description: 'Proteccion de muneca' },
  { id: 'item_07', name: 'Faja Lumbar',        icon: '🔰', price: 50,  description: 'Soporte lumbar pro' },
  { id: 'item_08', name: 'Zapatillas Gym',     icon: '👟', price: 65,  description: 'Calzado deportivo' },
  { id: 'item_09', name: 'Proteina en Polvo',  icon: '🧪', price: 80,  description: 'Suplemento deportivo' },
  { id: 'item_10', name: 'Rodillera Pro',      icon: '🦵', price: 100, description: 'Rodillera profesional' },
  { id: 'item_11', name: 'Chaleco Lastrado',   icon: '🦺', price: 120, description: 'Entrenamiento de peso' },
  { id: 'item_12', name: 'Bandas Elasticas',   icon: '🔗', price: 150, description: 'Set de bandas resistencia' },
  { id: 'item_13', name: 'Mancuerna de Plata', icon: '🥈', price: 180, description: 'Coleccionable de plata' },
  { id: 'item_14', name: 'Kettlebell',         icon: '⚙️', price: 220, description: 'Pesa rusa premium' },
  { id: 'item_15', name: 'Barra de Dominadas', icon: '🏗️', price: 270, description: 'Equipamiento de gym' },
  { id: 'item_16', name: 'TRX Premium',        icon: '🎯', price: 330, description: 'Suspension trainer' },
  { id: 'item_17', name: 'Acceso VIP',         icon: '⭐', price: 400, description: 'Acceso exclusivo' },
  { id: 'item_18', name: 'Camiseta Chopped',   icon: '👕', price: 480, description: 'Merch oficial' },
  { id: 'item_19', name: 'Trofeo de Bronce',   icon: '🏆', price: 570, description: 'Trofeo de elite' },
  { id: 'item_20', name: 'Campeon Chopped',    icon: '👑', price: 670, description: 'Coleccionable supremo' },
];
