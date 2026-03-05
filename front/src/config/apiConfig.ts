import { Platform } from 'react-native';

const HOST = Platform.OS === 'web' ? 'localhost' : 'IP reaseau';
const PORT = '8000';

export const BASE_URL = `http://${HOST}:${PORT}`;
export const API_URL = `${BASE_URL}/api`;