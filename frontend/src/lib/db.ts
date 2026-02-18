import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface MeetingDB extends DBSchema {
    meetings: {
        key: string;
        value: {
            id: string;
            title: string;
            transcript: any[];
            audioBlob?: Blob;
            createdAt: number;
            synced: boolean;
        };
    };
    pendingUploads: {
        key: string;
        value: {
            meetingId: string;
            audioBlob: Blob;
            retryCount: number;
        };
    };
}

let dbPromise: Promise<IDBPDatabase<MeetingDB>> | null = null;

export const initDB = async () => {
    if (!dbPromise) {
        dbPromise = openDB<MeetingDB>('meeting-assistant', 1, {
            upgrade(db) {
                // Create meetings store
                if (!db.objectStoreNames.contains('meetings')) {
                    const meetingStore = db.createObjectStore('meetings', { keyPath: 'id' });
                    meetingStore.createIndex('synced', 'synced');
                    meetingStore.createIndex('createdAt', 'createdAt');
                }

                // Create pending uploads store
                if (!db.objectStoreNames.contains('pendingUploads')) {
                    db.createObjectStore('pendingUploads', { keyPath: 'meetingId' });
                }
            },
        });
    }
    return dbPromise;
};

export const saveMeetingOffline = async (
    meetingId: string,
    title: string,
    transcript: any[],
    audioBlob?: Blob
) => {
    const db = await initDB();
    await db.put('meetings', {
        id: meetingId,
        title,
        transcript,
        audioBlob,
        createdAt: Date.now(),
        synced: false
    });

    if (audioBlob) {
        await db.put('pendingUploads', {
            meetingId,
            audioBlob,
            retryCount: 0
        });
    }
};

export const getOfflineMeeting = async (meetingId: string) => {
    const db = await initDB();
    return db.get('meetings', meetingId);
};

export const getPendingUploads = async () => {
    const db = await initDB();
    return db.getAll('pendingUploads');
};

export const markMeetingSynced = async (meetingId: string) => {
    const db = await initDB();
    const meeting = await db.get('meetings', meetingId);
    if (meeting) {
        meeting.synced = true;
        await db.put('meetings', meeting);
        await db.delete('pendingUploads', meetingId);
    }
};