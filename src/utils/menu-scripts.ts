// src/utils/menu-scripts.ts
import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { MenuItemType } from '../context/AppContext';
import { COLLECTIONS } from './constants';
import { auth, db } from './firebase';

export const deleteAllMenuItems = async () => {
    if (!auth.currentUser) {
        alert('Debes estar autenticado para eliminar el menú.');
        return;
    }
    if (!window.confirm('¿Estás seguro de que quieres eliminar TODO el menú? Esta acción es irreversible.')) {
        return;
    }
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.MENU));
        const batch = [];
        querySnapshot.forEach((docSnap) => {
            batch.push(deleteDoc(doc(db, COLLECTIONS.MENU, docSnap.id)));
        });
        await Promise.all(batch);
        alert('Menú eliminado completamente.');
        return true;
    } catch (error) {
        console.error('Error al eliminar el menú:', error);
        alert('Error al eliminar el menú.');
        return false;
    }
};

export const createDefaultMenuItemsAndCombos = async () => {
    if (!auth.currentUser) {
        alert('Debes estar autenticado para crear el menú por defecto.');
        return;
    }
    if (!window.confirm('¿Estás seguro de que quieres crear el menú por defecto? Esto reemplazará el menú actual.')) {
        return;
    }

    try {
        const menuCollection = collection(db, COLLECTIONS.MENU);

        // Productos base (sin cambios en costos)
        const productosBase: Partial<MenuItemType>[] = [
            { name: 'Alitas BBQ', description: 'Alitas de pollo con salsa BBQ.', price: 3000, cost: 1500, points: 5, imageUrls: ['https://assets.unileversolutions.com/recipes-v2/237633.jpg'], available: true, recommendation: 'Alitas', observations: 'Salsa BBQ', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Alitas Miel Mostaza', description: 'Alitas de pollo con salsa miel mostaza.', price: 3000, cost: 1500, points: 5, imageUrls: ['https://assets.unileversolutions.com/recipes-v2/237633.jpg'], available: true, recommendation: 'Alitas', observations: 'Salsa miel mostaza', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Alitas Búfalo', description: 'Alitas de pollo con salsa búfalo.', price: 3000, cost: 1500, points: 5, imageUrls: ['https://assets.unileversolutions.com/recipes-v2/237633.jpg'], available: true, recommendation: 'Alitas', observations: 'Salsa búfalo', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Pollo a la naranja', description: 'Pollo a la naranja con papa rustica.', price: 12000, cost: 6000, points: 15, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Especialidades', observations: '', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Tiras de pollo', description: 'Tiras de pollo con papas rustica.', price: 10000, cost: 5000, points: 10, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Especialidades', observations: '', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Nuggets de pollo', description: 'Nuggets de pollo con papas rustica.', price: 10000, cost: 5000, points: 10, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Especialidades', observations: '', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Presa de pollo', description: 'Presa de pollo (Ala, Muslo o Contramuslo).', price: 5500, cost: 2200, points: 5, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Presas', observations: 'Ala, Muslo o Contramuslo', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Pechuga de pollo', description: 'Pechuga de pollo.', price: 7000, cost: 3500, points: 8, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Pechuga', observations: '', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Porcion de papas rusticas', description: 'Porcion de papas rusticas.', price: 3000, cost: 1200, points: 3, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Acompañamiento', observations: '', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Porcion de arroz', description: 'Porcion de arroz.', price: 2000, cost: 800, points: 2, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Acompañamiento', observations: '', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Jugo Natural', description: 'Jugo Natural (varios sabores).', price: 4000, cost: 1800, points: 4, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Acompañamiento', observations: 'Varios sabores disponibles', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Vaso gaseosa', description: 'Vaso de gaseosa.', price: 1000, cost: 400, points: 1, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Acompañamiento', observations: 'Varias marcas disponibles', availabilityStatus: 'disponible', isCombo: false, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
        ];

        // Combos - AHORA CON PRECIOS Y PUNTOS ESTIMADOS
        const combos: Partial<MenuItemType>[] = [
            { name: 'Combo x 4 alitas', description: 'Combo de 4 alitas (1 salsa a elección).', price: 11000, cost: 6000, points: 15, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Alitas', observations: '1 salsa a elección', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo x 6 alitas', description: 'Combo de 6 alitas (1 salsa a elección).', price: 15000, cost: 9000, points: 20, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Alitas', observations: '1 salsa a elección', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo x 12 alitas', description: 'Combo de 12 alitas (2 salsas a elección).', price: 25000, cost: 18000, points: 30, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Alitas', observations: '2 salsas a elección', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo x 24 alitas', description: 'Combo de 24 alitas (3 salsas a elección).', price: 45000, cost: 36000, points: 50, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Alitas', observations: '3 salsas a elección', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo Pollo Jugo', description: '1 Pollo broaster personal + 1 Jugo natural a elección.', price: 20000, cost: 8800, points: 30, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Combo clásico y completo', observations: 'Elige el sabor del jugo', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo Alitas Papas', description: 'Alitas BBQ (6 unidades) + Porción de papas fritas pequeña.', price: 16000, cost: 10200, points: 20, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Perfecto para compartir', observations: '', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo Familiar Broaster', description: '2 Pollos broaster personales + 2 Porciones de papas fritas pequeñas + 2 Jugos naturales grandes.', price: 50000, cost: 30000, points: 60, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Ideal para familias o grupos', observations: 'Incluye aderezos y salsas', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo Individual Alipapas', description: '1 Alipapas Personal + 1 Limonada Natural.', price: 24000, cost: 11300, points: 30, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Opción rápida y deliciosa', observations: '', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo Doble Pollo', description: '2 Pollos broaster personales + Porción de arroz pequeña.', price: 38000, cost: 15200, points: 40, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Para compartir o para mucho apetito', observations: 'Incluye salsas', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo Alitas y Arroz', description: 'Alitas BBQ (6 unidades) + Porción de arroz pequeña.', price: 17000, cost: 10200, points: 20, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Combinación sabrosa y económica', observations: '', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Super Combo Pollo Completo', description: '2 Pollos broaster personales + Alitas BBQ (6 unidades) + Porción de papas fritas pequeña + 2 Limonadas Cerezadas.', price: 65000, cost: 35600, points: 80, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'El combo más completo para compartir', observations: 'Incluye todas las salsas y aderezos', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo Ahorro Alitas', description: 'Alitas BBQ (12 unidades) + Porción de papas fritas pequeña.', price: 22000, cost: 19200, points: 30, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Más alitas, más sabor', observations: 'Ideal para reuniones informales', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo Refrescante Limonada', description: 'Limonada Natural + Porción de papas fritas pequeña.', price: 12000, cost: 4700, points: 10, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Ligero y refrescante', observations: 'Perfecto para días calurosos', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
            { name: 'Combo Doble Jugo', description: '2 Jugos naturales a elección + Porción de arroz pequeña.', price: 18000, cost: 7100, points: 20, imageUrls: ['public/SrPolForYouSinTitle.svg'], available: true, recommendation: 'Para los amantes de los jugos naturales', observations: 'Elige tus sabores favoritos', availabilityStatus: 'disponible', isCombo: true, components: [], minimumPrice: 0, comboSellingPrice: 0, comboPoints: 0, additionalCosts: [], },
        ];

        // Añadir productos base
        const productIdsMap: { [key: string]: string } = {};
        for (const producto of productosBase) {
            const docRef = await addDoc(menuCollection, producto);
            productIdsMap[producto.name] = docRef.id;
        }

        // Añadir combos y referenciar componentes, AHORA CALCULANDO PRECIOS Y PUNTOS DE COMBO
        for (const combo of combos) {
            const comboComponents: string[] = [];
            let suggestedComboPrice = 0; // Para calcular precio de venta sugerido
            let suggestedComboPoints = 0; // Para calcular puntos sugeridos

            if (combo.name === 'Combo x 4 alitas') {
                for (let i = 0; i < 4; i++) {
                    comboComponents.push(productIdsMap['Alitas BBQ']);
                    suggestedComboPrice += productosBase.find(p => p.name === 'Alitas BBQ')?.price || 0;
                    suggestedComboPoints += productosBase.find(p => p.name === 'Alitas BBQ')?.points || 0;
                }
            } else if (combo.name === 'Combo x 6 alitas') {
                for (let i = 0; i < 6; i++) {
                    comboComponents.push(productIdsMap['Alitas BBQ']);
                    suggestedComboPrice += productosBase.find(p => p.name === 'Alitas BBQ')?.price || 0;
                    suggestedComboPoints += productosBase.find(p => p.name === 'Alitas BBQ')?.points || 0;
                }
            } else if (combo.name === 'Combo x 12 alitas') {
                for (let i = 0; i < 12; i++) {
                    comboComponents.push(productIdsMap['Alitas BBQ']);
                    suggestedComboPrice += productosBase.find(p => p.name === 'Alitas BBQ')?.price || 0;
                    suggestedComboPoints += productosBase.find(p => p.name === 'Alitas BBQ')?.points || 0;
                }
            } else if (combo.name === 'Combo x 24 alitas') {
                for (let i = 0; i < 24; i++) {
                    comboComponents.push(productIdsMap['Alitas BBQ']);
                    suggestedComboPrice += productosBase.find(p => p.name === 'Alitas BBQ')?.price || 0;
                    suggestedComboPoints += productosBase.find(p => p.name === 'Alitas BBQ')?.points || 0;
                }
            } else if (combo.name === 'Combo Pollo Jugo') {
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Jugo Natural Naranja']);
                suggestedComboPrice += productosBase.find(p => p.name === 'Pollo Broaster Personal')?.price || 0;
                suggestedComboPrice += productosBase.find(p => p.name === 'Jugo Natural Naranja')?.price || 0;
                suggestedComboPoints += productosBase.find(p => p.name === 'Pollo Broaster Personal')?.points || 0;
                suggestedComboPoints += productosBase.find(p => p.name === 'Jugo Natural Naranja')?.points || 0;
            } else if (combo.name === 'Combo Alitas Papas') {
                comboComponents.push(productIdsMap['Alitas BBQ (6 unidades)']);
                comboComponents.push(productIdsMap['Porcion de papas rusticas']);
                suggestedComboPrice += productosBase.find(p => p.name === 'Alitas BBQ (6 unidades)')?.price || 0;
                suggestedComboPrice += productosBase.find(p => p.name === 'Porcion de papas rusticas')?.price || 0;
                suggestedComboPoints += productosBase.find(p => p.name === 'Alitas BBQ (6 unidades)')?.points || 0;
                suggestedComboPoints += productosBase.find(p => p.name === 'Porcion de papas rusticas')?.points || 0;
            } else if (combo.name === 'Combo Familiar Broaster') {
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Porcion de papas rusticas']);
                comboComponents.push(productIdsMap['Porcion de papas rusticas']);
                comboComponents.push(productIdsMap['Jugo Natural Naranja']);
                comboComponents.push(productIdsMap['Jugo Natural Naranja']);
                suggestedComboPrice += (productosBase.find(p => p.name === 'Pollo Broaster Personal')?.price || 0) * 2;
                suggestedComboPrice += (productosBase.find(p => p.name === 'Porcion de papas rusticas')?.price || 0) * 2;
                suggestedComboPrice += (productosBase.find(p => p.name === 'Jugo Natural Naranja')?.price || 0) * 2;
                suggestedComboPoints += (productosBase.find(p => p.name === 'Pollo Broaster Personal')?.points || 0) * 2;
                suggestedComboPoints += (productosBase.find(p => p.name === 'Porcion de papas rusticas')?.points || 0) * 2;
                suggestedComboPoints += (productosBase.find(p => p.name === 'Jugo Natural Naranja')?.points || 0) * 2;
            } else if (combo.name === 'Combo Individual Alipapas') {
                comboComponents.push(productIdsMap['Alipapas Personal']);
                comboComponents.push(productIdsMap['Limonada Natural']);
                suggestedComboPrice += productosBase.find(p => p.name === 'Alipapas Personal')?.price || 0;
                suggestedComboPrice += productosBase.find(p => p.name === 'Limonada Natural')?.price || 0;
                suggestedComboPoints += productosBase.find(p => p.name === 'Alipapas Personal')?.points || 0;
                suggestedComboPoints += productosBase.find(p => p.name === 'Limonada Natural')?.points || 0;
            } else if (combo.name === 'Combo Doble Pollo') {
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Porcion de arroz']);
                suggestedComboPrice += (productosBase.find(p => p.name === 'Pollo Broaster Personal')?.price || 0) * 2;
                suggestedComboPrice += productosBase.find(p => p.name === 'Porcion de arroz')?.price || 0;
                suggestedComboPoints += (productosBase.find(p => p.name === 'Pollo Broaster Personal')?.points || 0) * 2;
                suggestedComboPoints += productosBase.find(p => p.name === 'Porcion de arroz')?.points || 0;
            } else if (combo.name === 'Combo Alitas y Arroz') {
                comboComponents.push(productIdsMap['Alitas BBQ (6 unidades)']);
                comboComponents.push(productIdsMap['Porcion de arroz']);
                suggestedComboPrice += productosBase.find(p => p.name === 'Alitas BBQ (6 unidades)')?.price || 0;
                suggestedComboPrice += productosBase.find(p => p.name === 'Porcion de arroz')?.price || 0;
                suggestedComboPoints += productosBase.find(p => p.name === 'Alitas BBQ (6 unidades)')?.points || 0;
                suggestedComboPoints += productosBase.find(p => p.name === 'Porcion de arroz')?.points || 0;
            } else if (combo.name === 'Super Combo Pollo Completo') {
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Alitas BBQ (6 unidades)']);
                comboComponents.push(productIdsMap['Porcion de papas rusticas']);
                comboComponents.push(productIdsMap['Limonada Cerezada']);
                comboComponents.push(productIdsMap['Limonada Cerezada']);
                suggestedComboPrice += (productosBase.find(p => p.name === 'Pollo Broaster Personal')?.price || 0) * 2;
                suggestedComboPrice += productosBase.find(p => p.name === 'Alitas BBQ (6 unidades)')?.price || 0;
                suggestedComboPrice += productosBase.find(p => p.name === 'Porcion de papas rusticas')?.price || 0;
                suggestedComboPrice += (productosBase.find(p => p.name === 'Limonada Cerezada')?.price || 0) * 2;
                suggestedComboPoints += (productosBase.find(p => p.name === 'Pollo Broaster Personal')?.points || 0) * 2;
                suggestedComboPoints += productosBase.find(p => p.name === 'Alitas BBQ (6 unidades)')?.points || 0;
                suggestedComboPoints += productosBase.find(p => p.name === 'Porcion de papas rusticas')?.points || 0;
                suggestedComboPoints += (productosBase.find(p => p.name === 'Limonada Cerezada')?.points || 0) * 2;
            } else if (combo.name === 'Combo Ahorro Alitas') {
                comboComponents.push(productIdsMap['Alitas BBQ (6 unidades)']);
                comboComponents.push(productIdsMap['Alitas BBQ (6 unidades)']);
                comboComponents.push(productIdsMap['Porcion de papas rusticas']);
                suggestedComboPrice += (productosBase.find(p => p.name === 'Alitas BBQ (6 unidades)')?.price || 0) * 2;
                suggestedComboPrice += productosBase.find(p => p.name === 'Porcion de papas rusticas')?.price || 0;
                suggestedComboPoints += (productosBase.find(p => p.name === 'Alitas BBQ (6 unidades)')?.points || 0) * 2;
                suggestedComboPoints += productosBase.find(p => p.name === 'Porcion de papas rusticas')?.points || 0;
            } else if (combo.name === 'Combo Refrescante Limonada') {
                comboComponents.push(productIdsMap['Limonada Natural']);
                comboComponents.push(productIdsMap['Porcion de papas rusticas']);
                suggestedComboPrice += productosBase.find(p => p.name === 'Limonada Natural')?.price || 0;
                suggestedComboPrice += productosBase.find(p => p.name === 'Porcion de papas rusticas')?.price || 0;
                suggestedComboPoints += productosBase.find(p => p.name === 'Limonada Natural')?.points || 0;
                suggestedComboPoints += productosBase.find(p => p.name === 'Porcion de papas rusticas')?.points || 0;
            } else if (combo.name === 'Combo Doble Jugo') {
                comboComponents.push(productIdsMap['Jugo Natural Naranja']);
                comboComponents.push(productIdsMap['Jugo Natural Naranja']);
                comboComponents.push(productIdsMap['Porcion de arroz']);
                suggestedComboPrice += (productosBase.find(p => p.name === 'Jugo Natural Naranja')?.price || 0) * 2;
                suggestedComboPrice += productosBase.find(p => p.name === 'Porcion de arroz')?.price || 0;
                suggestedComboPoints += (productosBase.find(p => p.name === 'Jugo Natural Naranja')?.points || 0) * 2;
                suggestedComboPoints += productosBase.find(p => p.name === 'Porcion de arroz')?.points || 0;
            }


            const comboSellingPrice = suggestedComboPrice * 0.9; // Aplicar 10% de descuento al precio sugerido
            const comboToSave: Partial<MenuItemType> = {
                ...combo,
                components: comboComponents,
                comboSellingPrice: comboSellingPrice,
                comboPoints: suggestedComboPoints,
                minimumPrice: combo.cost // Usar el costo estimado como minimumPrice
            };
            await addDoc(menuCollection, comboToSave);
        }


        alert('Menú por defecto creado exitosamente.');
        return true;
    } catch (error) {
        console.error('Error al crear el menú por defecto:', error);
        alert('Error al crear el menú por defecto.');
        return false;
    }
};