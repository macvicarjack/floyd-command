import axios from 'axios';
import { Task, Template, DigestData, Metrics } from './types';

const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:5002/api'
  : 'https://floyds-mac-mini.tail4b156f.ts.net/floyd-api/api';

const api = axios.create({ baseURL: API_BASE });

// Basic CRUD
export const getTasks = () => api.get<Task[]>('/tasks');
export const getTask = (id: string) => api.get<Task>(`/tasks/${id}`);
export const createTask = (task: Partial<Task>) => api.post<Task>('/tasks', task);
export const updateTask = (id: string, task: Partial<Task>) => api.put<Task>(`/tasks/${id}`, task);
export const deleteTask = (id: string) => api.delete(`/tasks/${id}`);

// Feature endpoints
export const getNextTask = () => api.get<Task | null>('/next');
export const claimTask = (id: string) => api.post<Task>(`/tasks/${id}/claim`);
export const completeTask = (id: string, artifacts?: any[]) => 
  api.post<Task>(`/tasks/${id}/complete`, { artifacts });
export const quickCapture = (title: string) => 
  api.post<Task>('/tasks/quick', { title });
export const getDigest = () => api.get<DigestData>('/digest');
export const breakdownTask = (id: string) => api.post(`/tasks/${id}/breakdown`);
export const addArtifact = (id: string, artifact: any) => 
  api.post<Task>(`/tasks/${id}/artifacts`, artifact);

// Templates
export const getTemplates = () => api.get<Template[]>('/templates');
export const createFromTemplate = (templateId: string, data?: Partial<Task>) => 
  api.post<Task>(`/tasks/from-template/${templateId}`, data);

// Metrics & Alerts
export const getMetrics = () => api.get<Metrics>('/metrics');
export const getAlerts = () => api.get('/alerts');

export default api;
