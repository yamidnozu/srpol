// src/utils/menu-scripts.ts
import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { MenuItemType } from '../context/AppContext'; // Asegúrate de la ruta correcta
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
        return true; // Indica éxito
    } catch (error) {
        console.error('Error al eliminar el menú:', error);
        alert('Error al eliminar el menú.');
        return false; // Indica fallo
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

        // Productos base
        const productosBase: Omit<MenuItemType, 'id'>[] = [
            {
                name: 'Jugo Natural Naranja',
                description: 'Jugo refrescante de naranja natural.',
                price: 8000,
                cost: 3000,
                points: 10,
                imageUrls: ['https://bognermex.com/cdn/shop/articles/500x500.jpg?v=1683239129', 'https://cdnx.jumpseller.com/el-kiosco-golosinas/image/24547259/El_Kiosco_jugos_naturales.jpg?1653862612', 'https://lirp.cdn-website.com/586fb047/dms3rep/multi/opt/jugos+naturales-1920w.jpg'],
                available: true,
                recommendation: 'Bebida refrescante',
                observations: '',
                availabilityStatus: 'disponible',
                isCombo: false,
                components: [],
                minimumPrice: 0,
                comboSellingPrice: 0,
                comboPoints: 0,
                additionalCosts: [],
            },
            {
                name: 'Jugo Natural Fresa',
                description: 'Jugo refrescante de fresa natural.',
                price: 9000,
                cost: 3500,
                points: 10,
                imageUrls: ['https://bognermex.com/cdn/shop/articles/500x500.jpg?v=1683239129', 'https://cdnx.jumpseller.com/el-kiosco-golosinas/image/24547259/El_Kiosco_jugos_naturales.jpg?1653862612', 'https://lirp.cdn-website.com/586fb047/dms3rep/multi/opt/jugos+naturales-1920w.jpg'],
                available: true,
                recommendation: 'Bebida dulce y refrescante',
                observations: '',
                availabilityStatus: 'disponible',
                isCombo: false,
                components: [],
                minimumPrice: 0,
                comboSellingPrice: 0,
                comboPoints: 0,
                additionalCosts: [],
            },
            {
                name: 'Limonada Natural',
                description: 'Clásica limonada refrescante.',
                price: 7000,
                cost: 2500,
                points: 10,
                imageUrls: ['https://www.hersheyland.mx/content/dam/Hersheyland_Mexico/es_mx/recipes/recipe-images/limonada.jpg', 'https://i.blogs.es/27a047/limonadas-variadas/1366_2000.jpg', 'https://i.blogs.es/5b3c0d/1366_2000-1-/1366_2000.jpg'],
                available: true,
                recommendation: 'Ideal para acompañar comidas',
                observations: 'Se puede pedir sin azúcar',
                availabilityStatus: 'disponible',
                isCombo: false,
                components: [],
                minimumPrice: 0,
                comboSellingPrice: 0,
                comboPoints: 0,
                additionalCosts: [],
            },
            {
                name: 'Limonada Cerezada',
                description: 'Limonada con un toque dulce de cereza.',
                price: 8000,
                cost: 3000,
                points: 10,
                imageUrls: ['https://www.hersheyland.mx/content/dam/Hersheyland_Mexico/es_mx/recipes/recipe-images/limonada.jpg', 'https://i.blogs.es/27a047/limonadas-variadas/1366_2000.jpg', 'https://i.blogs.es/5b3c0d/1366_2000-1-/1366_2000.jpg'],
                available: true,
                recommendation: 'Dulce y refrescante',
                observations: '',
                availabilityStatus: 'disponible',
                isCombo: false,
                components: [],
                minimumPrice: 0,
                comboSellingPrice: 0,
                comboPoints: 0,
                additionalCosts: [],
            },
            {
                name: 'Pollo Broaster Personal',
                description: 'Delicioso pollo broaster, crujiente y jugoso, porción personal.',
                price: 15000,
                cost: 7000,
                points: 20,
                imageUrls: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQG3B7ysBd_tXYPFKXQVjss1BipZ9Id-xr2QA&s', 'https://www.gourmet.com.co/wp-content/uploads/2023/12/Gourmet-Pollo-broaster.webp', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-vxztR7cg3LVOqUYHrUVBErD96T17RhL621TK5PE0IfPUXoVLT8sLneFQKeEmVQeYQtc&usqp=CAU'],
                available: true,
                recommendation: 'Nuestro plato estrella',
                observations: '',
                availabilityStatus: 'disponible',
                isCombo: false,
                components: [],
                minimumPrice: 0,
                comboSellingPrice: 0,
                comboPoints: 0,
                additionalCosts: [],
            },
            {
                name: 'Porción Papas Fritas Pequeña',
                description: 'Porción pequeña de papas fritas, crujientes y doradas.',
                price: 6000,
                cost: 2000,
                points: 10,
                imageUrls: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQprKoqyoxNcntQpFeC9Lu1ve5UxUe0Pe6PHg&s', 'https://www.paulinacocina.net/wp-content/uploads/2015/08/p1140112-640x480.jpg', 'https://imagenes.eltiempo.com/files/image_1200_600/uploads/2021/04/15/6078c68c2f49b.jpeg'],
                available: true,
                recommendation: 'Acompañante perfecto',
                observations: 'Se puede pedir con sal o sin sal',
                availabilityStatus: 'disponible',
                isCombo: false,
                components: [],
                minimumPrice: 0,
                comboSellingPrice: 0,
                comboPoints: 0,
                additionalCosts: [],
            },
            {
                name: 'Alitas BBQ (6 unidades)',
                description: '6 unidades de alitas de pollo en salsa BBQ.',
                price: 12000,
                cost: 5000,
                points: 10,
                imageUrls: ['https://assets.unileversolutions.com/recipes-v2/237633.jpg', 'https://cdn0.uncomo.com/es/posts/6/0/7/como_hacer_alitas_bbq_sin_horno_50706_600.jpg', 'https://www.unileverfoodsolutions.com.co/dam/global-ufs/mcos/NOLA/calcmenu/recipes/col-recipies/fruco/ALITAS-SALSA-1024X1024-px.jpg'],
                available: true,
                recommendation: 'Para picar y compartir',
                observations: 'Salsa BBQ casera',
                availabilityStatus: 'disponible',
                isCombo: false,
                components: [],
                minimumPrice: 0,
                comboSellingPrice: 0,
                comboPoints: 0,
                additionalCosts: [],
            },
            {
                name: 'Alipapas Personal',
                description: 'Combinación de alitas BBQ (3 unidades) y papas fritas porción personal.',
                price: 18000,
                cost: 8000,
                points: 20,
                imageUrls: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTE9vs5PvwBQ3EDf3oHaFjNlGTylZQQ76Zpag&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7StXb9BxAu9eDibcKlWihfQZKbSD1Aaf0M-mf3ZaxZUQzMvrURw4TJCKyjuU4S5QkeQY&usqp=CAU'],
                available: true,
                recommendation: 'Ideal para una persona',
                observations: '',
                availabilityStatus: 'disponible',
                isCombo: false,
                components: [],
                minimumPrice: 0,
                comboSellingPrice: 0,
                comboPoints: 0,
                additionalCosts: [],
            },
            {
                name: 'Porción Arroz Pequeña',
                description: 'Porción pequeña de arroz blanco.',
                price: 4000,
                cost: 1500,
                points: 10,
                imageUrls: ['https://img.freepik.com/fotos-premium/porcion-arroz-cocido-adornar_219193-12145.jpg', 'https://huertalejandro.com/wp-content/uploads/2020/05/arroz.jpg'],
                available: true,
                recommendation: 'Acompañante para platos fuertes',
                observations: '',
                availabilityStatus: 'disponible',
                isCombo: false,
                components: [],
                minimumPrice: 0,
                comboSellingPrice: 0,
                comboPoints: 0,
                additionalCosts: [],
            },
        ];

        // Combos
        const combos: Omit<MenuItemType, 'id'>[] = [
            {
                name: 'Combo Pollo Jugo',
                description: '1 Pollo broaster personal + 1 Jugo natural a elección.',
                price: 20000,
                cost: 10000,
                points: 30,
                imageUrls: ['https://www.gourmet.com.co/wp-content/uploads/2023/12/Gourmet-Pollo-broaster.webp', 'https://lirp.cdn-website.com/586fb047/dms3rep/multi/opt/jugos+naturales-1920w.jpg'],
                available: true,
                recommendation: 'Combo clásico y completo',
                observations: 'Elige el sabor del jugo',
                availabilityStatus: 'disponible',
                isCombo: true,
                components: [], // Se llenará dinámicamente
                minimumPrice: 0, // Se calculará dinámicamente
                comboSellingPrice: 20000,
                comboPoints: 30,
                additionalCosts: [],
            },
            {
                name: 'Combo Alitas Papas',
                description: 'Alitas BBQ (6 unidades) + Porción de papas fritas pequeña.',
                price: 16000,
                cost: 7000,
                points: 20,
                imageUrls: ['https://assets.unileversolutions.com/recipes-v2/237633.jpg', 'https://www.paulinacocina.net/wp-content/uploads/2015/08/p1140112-640x480.jpg'],
                available: true,
                recommendation: 'Perfecto para compartir',
                observations: '',
                availabilityStatus: 'disponible',
                isCombo: true,
                components: [], // Se llenará dinámicamente
                minimumPrice: 0, // Se calculará dinámicamente
                comboSellingPrice: 16000,
                comboPoints: 20,
                additionalCosts: [],
            },
            // ... (Combos adicionales - puedes agregar más siguiendo el mismo patrón)
            {
                name: 'Combo Familiar Broaster',
                description: '2 Pollos broaster personales + 2 Porciones de papas fritas pequeñas + 2 Jugos naturales grandes.',
                price: 50000,
                cost: 25000,
                points: 60,
                imageUrls: ['https://www.gourmet.com.co/wp-content/uploads/2023/12/Gourmet-Pollo-broaster.webp', 'https://www.paulinacocina.net/wp-content/uploads/2015/08/p1140112-640x480.jpg', 'https://lirp.cdn-website.com/586fb047/dms3rep/multi/opt/jugos+naturales-1920w.jpg'],
                available: true,
                recommendation: 'Ideal para familias o grupos',
                observations: 'Incluye aderezos y salsas',
                availabilityStatus: 'disponible',
                isCombo: true,
                components: [], // Se llenará dinámicamente
                minimumPrice: 0, // Se calculará dinámicamente
                comboSellingPrice: 50000,
                comboPoints: 60,
                additionalCosts: [],
            },
            {
                name: 'Combo Individual Alipapas',
                description: '1 Alipapas Personal + 1 Limonada Natural.',
                price: 24000,
                cost: 12000,
                points: 30,
                imageUrls: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTE9vs5PvwBQ3EDf3oHaFjNlGTylZQQ76Zpag&s', 'https://www.hersheyland.mx/content/dam/Hersheyland_Mexico/es_mx/recipes/recipe-images/limonada.jpg'],
                available: true,
                recommendation: 'Opción rápida y deliciosa',
                observations: '',
                availabilityStatus: 'disponible',
                isCombo: true,
                components: [], // Se llenará dinámicamente
                minimumPrice: 0, // Se calculará dinámicamente
                comboSellingPrice: 24000,
                comboPoints: 30,
                additionalCosts: [],
            },
            {
                name: 'Combo Doble Pollo',
                description: '2 Pollos broaster personales + Porción de arroz pequeña.',
                price: 38000,
                cost: 18000,
                points: 40,
                imageUrls: ['https://www.gourmet.com.co/wp-content/uploads/2023/12/Gourmet-Pollo-broaster.webp', 'https://img.freepik.com/fotos-premium/porcion-arroz-cocido-adornar_219193-12145.jpg'],
                available: true,
                recommendation: 'Para compartir o para mucho apetito',
                observations: 'Incluye salsas',
                availabilityStatus: 'disponible',
                isCombo: true,
                components: [], // Se llenará dinámicamente
                minimumPrice: 0, // Se calculará dinámicamente
                comboSellingPrice: 38000,
                comboPoints: 40,
                additionalCosts: [],
            },
            {
                name: 'Combo Alitas y Arroz',
                description: 'Alitas BBQ (6 unidades) + Porción de arroz pequeña.',
                price: 17000,
                cost: 8000,
                points: 20,
                imageUrls: ['https://assets.unileversolutions.com/recipes-v2/237633.jpg', 'https://img.freepik.com/fotos-premium/porcion-arroz-cocido-adornar_219193-12145.jpg'],
                available: true,
                recommendation: 'Combinación sabrosa y económica',
                observations: '',
                availabilityStatus: 'disponible',
                isCombo: true,
                components: [], // Se llenará dinámicamente
                minimumPrice: 0, // Se calculará dinámicamente
                comboSellingPrice: 17000,
                comboPoints: 20,
                additionalCosts: [],
            },
            {
                name: 'Super Combo Pollo Completo',
                description: '2 Pollos broaster personales + Alitas BBQ (6 unidades) + Porción de papas fritas pequeña + 2 Limonadas Cerezadas.',
                price: 65000,
                cost: 30000,
                points: 80,
                imageUrls: ['https://www.gourmet.com.co/wp-content/uploads/2023/12/Gourmet-Pollo-broaster.webp', 'https://assets.unileversolutions.com/recipes-v2/237633.jpg', 'https://www.paulinacocina.net/wp-content/uploads/2015/08/p1140112-640x480.jpg', 'https://www.hersheyland.mx/content/dam/Hersheyland_Mexico/es_mx/recipes/recipe-images/limonada.jpg'],
                available: true,
                recommendation: 'El combo más completo para compartir',
                observations: 'Incluye todas las salsas y aderezos',
                availabilityStatus: 'disponible',
                isCombo: true,
                components: [], // Se llenará dinámicamente
                minimumPrice: 0, // Se calculará dinámicamente
                comboSellingPrice: 65000,
                comboPoints: 80,
                additionalCosts: [],
            },
            {
                name: 'Combo Ahorro Alitas',
                description: 'Alitas BBQ (12 unidades) + Porción de papas fritas pequeña.',
                price: 22000,
                cost: 11000,
                points: 30,
                imageUrls: ['https://assets.unileversolutions.com/recipes-v2/237633.jpg', 'https://www.paulinacocina.net/wp-content/uploads/2015/08/p1140112-640x480.jpg'],
                available: true,
                recommendation: 'Más alitas, más sabor',
                observations: 'Ideal para reuniones informales',
                availabilityStatus: 'disponible',
                isCombo: true,
                components: [], // Se llenará dinámicamente
                minimumPrice: 0, // Se calculará dinámicamente
                comboSellingPrice: 22000,
                comboPoints: 30,
                additionalCosts: [],
            },
            {
                name: 'Combo Refrescante Limonada',
                description: 'Limonada Natural + Porción de papas fritas pequeña.',
                price: 12000,
                cost: 5000,
                points: 10,
                imageUrls: ['https://www.hersheyland.mx/content/dam/Hersheyland_Mexico/es_mx/recipes/recipe-images/limonada.jpg', 'https://www.paulinacocina.net/wp-content/uploads/2015/08/p1140112-640x480.jpg'],
                available: true,
                recommendation: 'Ligero y refrescante',
                observations: 'Perfecto para días calurosos',
                availabilityStatus: 'disponible',
                isCombo: true,
                components: [], // Se llenará dinámicamente
                minimumPrice: 0, // Se calculará dinámicamente
                comboSellingPrice: 12000,
                comboPoints: 10,
                additionalCosts: [],
            },
            {
                name: 'Combo Doble Jugo',
                description: '2 Jugos naturales a elección + Porción de arroz pequeña.',
                price: 18000,
                cost: 7000,
                points: 20,
                imageUrls: ['https://lirp.cdn-website.com/586fb047/dms3rep/multi/opt/jugos+naturales-1920w.jpg', 'https://img.freepik.com/fotos-premium/porcion-arroz-cocido-adornar_219193-12145.jpg'],
                available: true,
                recommendation: 'Para los amantes de los jugos naturales',
                observations: 'Elige tus sabores favoritos',
                availabilityStatus: 'disponible',
                isCombo: true,
                components: [], // Se llenará dinámicamente
                minimumPrice: 0, // Se calculará dinámicamente
                comboSellingPrice: 18000,
                comboPoints: 20,
                additionalCosts: [],
            },
        ];

        // Añadir productos base
        const productIdsMap: { [key: string]: string } = {}; // Mapa para guardar IDs de productos base
        for (const producto of productosBase) {
            const docRef = await addDoc(menuCollection, producto);
            productIdsMap[producto.name] = docRef.id; // Guardar ID usando el nombre del producto como clave
        }

        // Añadir combos y referenciar componentes
        for (const combo of combos) {
            const comboComponents: string[] = [];
            if (combo.name === 'Combo Pollo Jugo') {
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Jugo Natural Naranja']); // Puedes elegir un jugo por defecto o dejar la elección al usuario
            } else if (combo.name === 'Combo Alitas Papas') {
                comboComponents.push(productIdsMap['Alitas BBQ (6 unidades)']);
                comboComponents.push(productIdsMap['Porción Papas Fritas Pequeña']);
            } else if (combo.name === 'Combo Familiar Broaster') {
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Porción Papas Fritas Pequeña']);
                comboComponents.push(productIdsMap['Porción Papas Fritas Pequeña']);
                comboComponents.push(productIdsMap['Jugo Natural Naranja']); // Puedes elegir un jugo por defecto o dejar la elección al usuario
                comboComponents.push(productIdsMap['Jugo Natural Naranja']); // Puedes elegir un jugo por defecto o dejar la elección al usuario
            } else if (combo.name === 'Combo Individual Alipapas') {
                comboComponents.push(productIdsMap['Alipapas Personal']);
                comboComponents.push(productIdsMap['Limonada Natural']);
            } else if (combo.name === 'Combo Doble Pollo') {
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Porción Arroz Pequeña']);
            } else if (combo.name === 'Combo Alitas y Arroz') {
                comboComponents.push(productIdsMap['Alitas BBQ (6 unidades)']);
                comboComponents.push(productIdsMap['Porción Arroz Pequeña']);
            } else if (combo.name === 'Super Combo Pollo Completo') {
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Pollo Broaster Personal']);
                comboComponents.push(productIdsMap['Alitas BBQ (6 unidades)']);
                comboComponents.push(productIdsMap['Porción Papas Fritas Pequeña']);
                comboComponents.push(productIdsMap['Limonada Cerezada']);
                comboComponents.push(productIdsMap['Limonada Cerezada']);
            } else if (combo.name === 'Combo Ahorro Alitas') {
                comboComponents.push(productIdsMap['Alitas BBQ (6 unidades)']);
                comboComponents.push(productIdsMap['Alitas BBQ (6 unidades)']);
                comboComponents.push(productIdsMap['Porción Papas Fritas Pequeña']);
            } else if (combo.name === 'Combo Refrescante Limonada') {
                comboComponents.push(productIdsMap['Limonada Natural']);
                comboComponents.push(productIdsMap['Porción Papas Fritas Pequeña']);
            } else if (combo.name === 'Combo Doble Jugo') {
                comboComponents.push(productIdsMap['Jugo Natural Naranja']);
                comboComponents.push(productIdsMap['Jugo Natural Naranja']);
                comboComponents.push(productIdsMap['Porción Arroz Pequeña']);
            }

            const comboToSave = { ...combo, components: comboComponents };
            await addDoc(menuCollection, comboToSave);
        }

        alert('Menú por defecto creado exitosamente.');
        return true; // Indica éxito
    } catch (error) {
        console.error('Error al crear el menú por defecto:', error);
        alert('Error al crear el menú por defecto.');
        return false; // Indica fallo
    }


};

