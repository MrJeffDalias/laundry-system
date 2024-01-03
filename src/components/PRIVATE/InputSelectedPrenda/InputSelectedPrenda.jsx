/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import { useCallback } from 'react';
import Abrigo from '../../../utils/img/Prendas/abrigo.png';
import Alfombra from '../../../utils/img/Prendas/alfombra.png';
import Almohada from '../../../utils/img/Prendas/almohada.png';
import Camisa from '../../../utils/img/Prendas/camisa.png';
import Casaca from '../../../utils/img/Prendas/casaca.png';
import Cobertor from '../../../utils/img/Prendas/cobertor.png';
import Cortinas from '../../../utils/img/Prendas/cortinas.png';
import Cubrecama from '../../../utils/img/Prendas/cubrecama.png';
import Otro from '../../../utils/img/Prendas/desconocido.png';
import Frazada from '../../../utils/img/Prendas/frazada.png';
import Jean from '../../../utils/img/Prendas/jean.png';
import Manta from '../../../utils/img/Prendas/manta.png';
import Pantalon from '../../../utils/img/Prendas/pantalon.png';
import Polo from '../../../utils/img/Prendas/polo.png';
import Saco from '../../../utils/img/Prendas/saco.png';
import Tapete from '../../../utils/img/Prendas/tapete.png';
import Terno from '../../../utils/img/Prendas/terno.png';
import Zapatillas from '../../../utils/img/Prendas/zapatillas.png';
//import Edredon from "../../../utils/img/Prendas/edredon.png";
import { Avatar, Group, Select, Text } from '@mantine/core';
import { forwardRef, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

const SelectItem = forwardRef(({ image, label, ...others }, ref) => (
  <div ref={ref} {...others}>
    <Group noWrap={true}>
      <Avatar src={image} />
      <div>
        <Text>{label}</Text>
      </div>
    </Group>
  </div>
));

const InputSelectedPrenda = ({ listenClick, tabI, disabled }) => {
  const infoProductos = useSelector((state) => state.prenda.infoPrendas);
  const [data, setData] = useState([]);

  const getProductValue = useCallback((productos, nombre) => {
    const product = productos.find((producto) => producto.name.toLowerCase() === nombre.toLowerCase());

    if (product) {
      return product.price;
    }

    return 0;
  }, []);

  useEffect(() => {
    const productosDB = infoProductos;

    const info = [
      // {
      //   image: Edredon,
      //   label: "Edredon",
      //   value: ["Edredon", "19", true, "Edredon"], // Producto - precio - stado - Categoria
      // },
      {
        image: Cobertor,
        label: 'Cobertor',
        value: ['Cobertor', getProductValue(productosDB, 'Cobertor'), true, 'Edredon'],
      },
      {
        image: Cubrecama,
        label: 'Cubrecama',
        value: ['Cubrecama', getProductValue(productosDB, 'Cubrecama'), true, 'Edredon'],
      },

      {
        image: Frazada,
        label: 'Frazada',
        value: ['Frazada', getProductValue(productosDB, 'Frazada'), true, 'Edredon'],
      },
      {
        image: Manta,
        label: 'Manta',
        value: ['Manta', getProductValue(productosDB, 'Manta'), true, 'Edredon'],
      },
      {
        image: Casaca,
        label: 'Casaca',
        value: ['Casaca', getProductValue(productosDB, 'Casaca'), true, 'Planchado'],
      },
      {
        image: Terno,
        label: 'Terno',
        value: ['Terno', getProductValue(productosDB, 'Terno'), false, 'Planchado'],
      },
      {
        image: Saco,
        label: 'Saco',
        value: ['Saco', getProductValue(productosDB, 'Saco'), true, 'Planchado'],
      },
      {
        image: Camisa,
        label: 'Camisa',
        value: ['Camisa', getProductValue(productosDB, 'Camisa'), false, 'Planchado'],
      },
      {
        image: Pantalon,
        label: 'Pantalon',
        value: ['Pantalon', getProductValue(productosDB, 'Pantalon'), false, 'Planchado'],
      },
      {
        image: Abrigo,
        label: 'Abrigo',
        value: ['Abrigo', getProductValue(productosDB, 'Abrigo'), true, 'Planchado'],
      },
      {
        image: Zapatillas,
        label: 'Zapatillas',
        value: ['Zapatillas', getProductValue(productosDB, 'Zapatillas'), true, 'Zapatillas'],
      },
      {
        image: Jean,
        label: 'Jean',
        value: ['Jean', getProductValue(productosDB, 'Jean'), false, 'Planchado'],
      },
      {
        image: Polo,
        label: 'Polo',
        value: ['Polo', getProductValue(productosDB, 'Polo'), false, 'Planchado'],
      },
      {
        image: Alfombra,
        label: 'Alfombra',
        value: ['Alfombra', getProductValue(productosDB, 'Alfombra'), true, 'Edredon'],
      },
      {
        image: Cortinas,
        label: 'Cortinas',
        value: ['Cortinas', getProductValue(productosDB, 'Cortinas'), false, 'Cortinas'],
      },
      {
        image: Almohada,
        label: 'Almohada',
        value: ['Almohada', getProductValue(productosDB, 'Almohada'), false, 'Edredon'],
      },
      {
        image: Tapete,
        label: 'Tapete',
        value: ['Tapete', getProductValue(productosDB, 'Tapete'), true, 'Tapete'],
      },
      {
        image: Otro,
        label: 'Otros',
        value: ['', '', false, 'Otros'], // Producto - precio - stado - Categoria
      },
    ];

    setData(info);
  }, [infoProductos]);

  return (
    <Select
      label="Escoga Prenda :"
      placeholder="Escoga para agregar"
      itemComponent={SelectItem}
      data={data}
      searchable={true}
      tabIndex={tabI}
      disabled={disabled}
      dropdownPosition="bottom"
      maxDropdownHeight={300}
      size="lg"
      nothingFound="Nobody here"
      filter={(value, item) => item.label.toLowerCase().includes(value.toLowerCase().trim())}
      hoverOnSearchChange={true}
      onChange={(value) => {
        if (value[3] === 'Otros') {
          listenClick('otros', value[0], value[1], value[2], value[3]);
        } else {
          listenClick('productos', value[0], value[1], value[2], value[3]);
        }
      }}
    />
  );
};

export default InputSelectedPrenda;
