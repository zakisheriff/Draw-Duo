import AsyncStorage from '@react-native-async-storage/async-storage';

const ROOM_HISTORY_KEY = '@swing_mates_room_history';
const MAX_HISTORY_ITEMS = 20;

export interface RoomHistoryItem {
    roomId: string;
    username: string;
    lastVisited: number; // timestamp
    createdAt: number;
}

// Save a room to history
export async function saveRoomToHistory(roomId: string, username: string): Promise<void> {
    try {
        const history = await getRoomHistory();

        // Check if room already exists in history
        const existingIndex = history.findIndex(item => item.roomId === roomId);

        if (existingIndex !== -1) {
            // Update existing entry
            history[existingIndex].lastVisited = Date.now();
            history[existingIndex].username = username;
        } else {
            // Add new entry at the beginning
            history.unshift({
                roomId,
                username,
                lastVisited: Date.now(),
                createdAt: Date.now(),
            });
        }

        // Limit history size
        const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

        await AsyncStorage.setItem(ROOM_HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
        console.error('Error saving room to history:', error);
    }
}

// Get room history
export async function getRoomHistory(): Promise<RoomHistoryItem[]> {
    try {
        const historyJson = await AsyncStorage.getItem(ROOM_HISTORY_KEY);
        if (!historyJson) return [];
        return JSON.parse(historyJson);
    } catch (error) {
        console.error('Error getting room history:', error);
        return [];
    }
}

// Remove a room from history
export async function removeRoomFromHistory(roomId: string): Promise<void> {
    try {
        const history = await getRoomHistory();
        const filteredHistory = history.filter(item => item.roomId !== roomId);
        await AsyncStorage.setItem(ROOM_HISTORY_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
        console.error('Error removing room from history:', error);
    }
}

// Clear all history
export async function clearRoomHistory(): Promise<void> {
    try {
        await AsyncStorage.removeItem(ROOM_HISTORY_KEY);
    } catch (error) {
        console.error('Error clearing room history:', error);
    }
}
