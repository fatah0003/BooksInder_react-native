// Ce fichier décrit la structure de nos données de chat

// Une conversation entre 2 utilisateurs
export interface Conversation {
  id: string;                    // L'ID MongoDB de la conversation
  participants: string[];        // Les UUID des 2 utilisateurs
  exchangeId: number;            // L'ID de l'échange MySQL
  exchangeUuid: string;          // L'UUID de l'échange
  lastMessage: string | null;    // Le dernier message envoyé (ou null si vide)
  lastMessageAt: string | null;  // Date du dernier message (format ISO)
  createdAt: string;             // Date de création de la conversation
}

// Un message dans une conversation
export interface Message {
  id: string;              // L'ID MongoDB du message
  conversationId: string;  // À quelle conversation appartient ce message
  senderUuid: string;      // Qui a envoyé le message (UUID)
  content: string;         // Le texte du message
  createdAt: string;       // Date d'envoi (format ISO)
}
