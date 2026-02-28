import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 50,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
    },
    backButton: {
        padding: 5,
    },
    notificationIcon: {
        padding: 5,
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },

    // Illustration
    illustrationContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    illustration: {
        width: 200,
        height: 150,
    },

    // Avatar
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E8EAF6',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Infos utilisateur
    userInfoSection: {
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        padding: 15,
        backgroundColor: '#FAFAFA',
    },

    // Row principale avec 2 colonnes
    mainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    // Colonne gauche (infos)
    leftColumn: {
        flex: 1,
        paddingRight: 15,
    },

    // Colonne droite (bio)
    rightColumn: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: 15,
        borderLeftWidth: 1,
        borderLeftColor: '#E0E0E0',
    },

    // Me + Biographie
    meText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    bioLabel: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#666',
    },
    bioContent: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },
    bioPlaceholder: {
        fontSize: 12,
        color: '#999',
        lineHeight: 16,
        fontStyle: 'italic',
    },

    // Row pour chaque info
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    infoText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },


    // Row pour email + me/bio
    emailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    emailLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },

    // Container me + bio à droite
    meAndBioContainer: {
        flex: 1,
        marginLeft: 10,
    },
    // Row normale pour les autres infos

    meTag: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    meTagText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    bioText: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    bioContainer: {
        marginLeft: 44,
        marginTop: -10,
        marginBottom: 15,
    },
    bioTextContent: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },

    // Boutons
    primaryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 25,
        marginHorizontal: 20,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 25,
        marginHorizontal: 20,
        marginBottom: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 25,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 12,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 16,
        borderRadius: 25,
        marginHorizontal: 20,
        marginBottom: 12,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Section livres
    booksSection: {
        marginTop: 30,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#000',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#666',
    },
    emptyBooksContainer: {
        backgroundColor: '#F5F5F5',
        padding: 30,
        borderRadius: 10,
        alignItems: 'center',
    },
    noBooksText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },

    // Grille de livres (2 colonnes)
    booksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    bookCard: {
        width: '48%',
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    bookImage: {
        width: '100%',
        height: 200,
    },
    noImagePlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        fontSize: 50,
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    bookAuthor: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#000',
        paddingHorizontal: 10,
        paddingTop: 5,
    },
    bookLocation: {
        fontSize: 12,
        color: '#999',
        paddingHorizontal: 10,
        paddingBottom: 10,
        paddingTop: 5,
    },
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        borderColor: '#eaebf0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    // Me row avec icône
    meRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    meIcon: {
        marginRight: 6,
    },
    // Trait séparateur
    divider: {
        height: 2,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 20,
        marginVertical: 20,
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    passwordInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#F5F5F5',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelModalButton: {
        flex: 1,
        backgroundColor: '#E0E0E0',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelModalButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteModalButton: {
        flex: 1,
        backgroundColor: '#FF3B30',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    deleteModalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
