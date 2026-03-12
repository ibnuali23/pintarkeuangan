import { useState, useCallback } from 'react';

export const useGoogleAuth = () => {
    const [isTokenLoading, setIsTokenLoading] = useState(false);

    const getAccessToken = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            setIsTokenLoading(true);

            if (!window.google?.accounts?.oauth2) {
                setIsTokenLoading(false);
                reject(new Error('Google Identity Services script not loaded'));
                return;
            }

            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (!clientId) {
                setIsTokenLoading(false);
                reject(new Error('VITE_GOOGLE_CLIENT_ID is not configured in .env'));
                return;
            }

            try {
                const tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: 'https://www.googleapis.com/auth/drive.file',
                    callback: (tokenResponse: any) => {
                        setIsTokenLoading(false);
                        if (tokenResponse.error !== undefined) {
                            reject(tokenResponse);
                        } else {
                            resolve(tokenResponse.access_token);
                        }
                    },
                    error_callback: (error: any) => {
                        setIsTokenLoading(false);
                        reject(error);
                    },
                } as any);

                tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (error) {
                setIsTokenLoading(false);
                reject(error);
            }
        });
    }, []);

    return { getAccessToken, isTokenLoading };
};
