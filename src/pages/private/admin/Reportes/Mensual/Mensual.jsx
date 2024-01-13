/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';

import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { MonthPickerInput } from '@mantine/dates';
import './mensual.scss';
import { Notify } from '../../../../../utils/notify/Notify';
import moment from 'moment';
import { handleProductoCantidad } from '../../../../../utils/functions';
import { simboloMoneda } from '../../../../../services/global';

const Mensual = ({ onClose }) => {
  const [datePrincipal, setDatePrincipal] = useState(new Date());

  const openModal = () => {
    onClose();
    const month = moment.utc(datePrincipal).format('MMMM');
    modals.openConfirmModal({
      title: 'Exportar a Excel',
      centered: true,
      children: <Text size="sm">¿ Desea Generar Reporte Excel de : {month.toUpperCase()} ?</Text>,
      labels: { confirm: 'Si', cancel: 'No' },
      confirmProps: { color: 'green' },
      onConfirm: () => exportToExcel(),
    });
  };

  const exportToExcel = async () => {
    const mes = String(datePrincipal.getMonth() + 1).padStart(2, '0');
    const anio = datePrincipal.getFullYear();

    const nombreMes = moment(datePrincipal).format('MMMM');

    const fileName = `Reporte de ${nombreMes}, del ${anio}`;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/lava-ya/get-reporte-mensual?mes=${mes}&anio=${anio}`
      );
      if (response.data) {
        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Datos');

        // Estilos para el encabezado
        const headerStyle = {
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '333333' }, // Color de fondo para la cabecera (gris oscuro)
          },
          font: {
            color: { argb: 'FFFFFF' }, // Color del texto en la cabecera (blanco)
            bold: true, // Texto en negrita
          },
        };

        // Agregar la cabecera
        worksheet
          .addRow([
            'Orden N°',
            'Nombre',
            'Modalidad',
            'Pago',
            'Productos',
            // 'Cantidad',
            'Monto',
            'Celular',
            'Documento',
            'Medio de Pago',
            'Fecha de Ingreso',
            'Fecha de Salida',
          ])
          .eachCell((cell) => {
            cell.fill = headerStyle.fill;
            cell.font = headerStyle.font;
          });
        response.data.forEach((item) => {
          const productsText = Array.from(handleProductoCantidad(item.Producto)).join('\n');

          worksheet.addRow([
            String(item.codRecibo).padStart(4, '0'),
            item.Nombre,
            item.Modalidad,
            item.Pago,
            productsText,
            // quantitiesText,
            `${simboloMoneda} ${item.totalNeto}`,
            item.celular,
            item.dni,
            item.metodoPago.charAt(0) + item.metodoPago.slice(1).toLowerCase(),
            item.dateRecepcion.fecha,
            item.dateEntrega.fecha,
          ]);
        });

        const productsColumn = worksheet.getColumn(5);

        worksheet.eachRow((row) => {
          row.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        });

        // Ajustar automáticamente el ancho de las columnas excepto "Products" basado en el contenido
        let maxLengthColumns = 0;
        await worksheet.columns.forEach((column) => {
          if (column !== productsColumn) {
            column.eachCell({ includeEmpty: true }, (cell) => {
              const cellLength = cell.value ? cell.value.toString().length : 10;
              maxLengthColumns = Math.max(maxLengthColumns, cellLength);
            });
            column.width = maxLengthColumns + 5; // Agrega un espacio adicional
          }
        });

        const maxLineLengths = [];
        await worksheet.eachRow({ includeEmpty: true }, (row) => {
          const cell = row.getCell(5); // Obtener la celda de la columna "Products"
          const lines = cell.text.split('\n');
          let maxLength = 0;
          lines.forEach((line) => {
            const lineLength = line.length;
            maxLength = Math.max(maxLength, lineLength);
          });
          maxLineLengths.push(maxLength);
        });

        const maxLength = Math.max(...maxLineLengths);
        productsColumn.width = maxLength + 4;

        // Aplicar autofiltro a todas las columnas y filas
        const totalRows = worksheet.rowCount;
        const totalColumns = worksheet.columnCount;

        worksheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: totalRows, column: totalColumns },
        };

        const HeaderProducts = worksheet.getCell('E1');

        productsColumn.alignment = {
          horizontal: 'left',
          vertical: 'middle',
          wrapText: true,
          indent: 1,
        };
        HeaderProducts.alignment = { horizontal: 'center', vertical: 'middle' };

        // Guardar el archivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + '.xlsx';
        a.click();

        URL.revokeObjectURL(url);
      }
    } catch (error) {
      Notify('Error', 'No se pudo Generar reporte EXCEL', 'fail');
      console.log(error.response.data.mensaje);
    }
  };

  return (
    <div className="cr_monthly">
      <MonthPickerInput
        style={{ position: 'relative' }}
        label="Ingrese Fecha"
        placeholder="Pick date"
        value={datePrincipal}
        onChange={(date) => {
          setDatePrincipal(date);
        }}
        mx="auto"
        maw={400}
      />
      <button className="xport-xsls" onClick={openModal}>
        Exportar a Excel
      </button>
    </div>
  );
};

export default Mensual;
