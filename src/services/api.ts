// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const renderVideo = async (composition: string, props: object) => {
  const response = await api.post('/render', {
    composition,
    props,
    format: 'mp4'
  });
  return response.data.renderId;
};

export const getRenderProgress = async (renderId: string) => {
  const response = await api.get(`/render/${renderId}/progress`);
  return response.data;
};