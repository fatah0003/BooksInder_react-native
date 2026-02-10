/*seul changement au changement de reseau auquel le pc est connecté*/
 const HOST = '192.168.1.115'; //Ethernet maison
// const HOST = '172.20.153.22'; // wifi partage téléphone
// const HOST = ''; // Wifi centre formation
// const HOST = '192.168.1.56'; //wifi maison
const PORT = '8000';

export const BASE_URL = `http://${HOST}:${PORT}`;
export const API_URL = `${BASE_URL}/api`;