import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { Notify } from '../../utils/notify/Notify';

export const AddGasto = createAsyncThunk('gasto/AddGasto', async (infoGasto) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/lava-ya/add-gasto`, infoGasto);

    return response.data;
  } catch (error) {
    console.log(error.response.data.mensaje);
    Notify('Error', 'No se pudo agregar Gasto', 'fail');
    throw new Error(error);
  }
});

export const GetGastos = createAsyncThunk('gasto/GetGastos', async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/lava-ya/get-gastos`);

    return response.data;
  } catch (error) {
    // Puedes manejar los errores aquí
    throw new Error(`No se pudieron obtener los datos del usuario - ${error}`);
  }
});

export const GetGastoDate = createAsyncThunk('gastos/GetGastosDate', async (fecha) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/lava-ya/get-gastos-date/${fecha}`);

    return response.data;
  } catch (error) {
    // Puedes manejar los errores aquí
    throw new Error(`No se pudieron obtener los datos del usuario - ${error}`);
  }
});
