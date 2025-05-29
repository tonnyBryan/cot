import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
    const [session, setSession] = useState({});

    useEffect(() => {
        const loadSession = async () => {
            try {
                const jsonValue = await AsyncStorage.getItem('@app_session');
                if (jsonValue != null) {
                    setSession(JSON.parse(jsonValue));
                }
            } catch (e) {
                console.error("Erreur chargement session", e);
            }
        };
        loadSession();
    }, []);

    useEffect(() => {
        const saveSession = async () => {
            try {
                await AsyncStorage.setItem('@app_session', JSON.stringify(session));
            } catch (e) {
                console.error("Erreur sauvegarde session", e);
            }
        };
        saveSession();
    }, [session]);

    const addSession = (key, value) => {
        setSession(prev => ({ ...prev, [key]: value }));
    };

    const removeSession = (key) => {
        setSession(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    // Nouvelle fonction getSession
    const getSession = (key) => {
        return session[key];
    };

    return (
        <SessionContext.Provider value={{ session, addSession, removeSession, getSession }}>
            {children}
        </SessionContext.Provider>
    );
};
