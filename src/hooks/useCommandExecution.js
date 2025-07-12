import { useState, useRef } from 'react';

export const useCommandExecution = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [currentPid, setCurrentPid] = useState(null);
    const eventSourceRef = useRef(null);

    const addLog = (type, message, timestamp = new Date()) => {
        setLogs(prev => [...prev, { type, message, timestamp }]);
    };

    const handleStreamMessage = (data) => {
        switch (data.type) {
            case 'start':
                addLog('info', data.message);
                return null;
            case 'stdout':
                addLog('stdout', data.data);
                return null;
            case 'stderr':
                addLog('stderr', data.data);
                return null;
            case 'end':
                addLog('info', data.message);
                const endResult = {
                    success: data.success,
                    message: data.message,
                    code: data.code
                }
                setResult(endResult);
                setIsLoading(false);
                return endResult;
            case 'error':
                addLog('error', data.error);
                setError(data.error);
                setIsLoading(false);
                return null;
            case 'pid':
                setCurrentPid(data.pid);
                return null;
        }
    };

    const executeCommand = async (url = '/api/engToolkit/actions', requestBody) => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setLogs([]);

        try {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let endResult = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            endResult = handleStreamMessage(data);
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }

            return endResult;
        } catch (err) {
            setError('Failed to execute command: ' + err.message);
            setIsLoading(false);
        }
    };

    const stopExecution = async (stopUrl = '/api/engToolkit/stop') => {
        console.log('stopUrl', stopUrl);
        if (currentPid) {
            try {
                const response = await fetch(stopUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ pid: currentPid })
                });

                if (!response.ok) {
                    addLog('error', `Failed to stop process`);
                }

                setCurrentPid(null);
            } catch (error) {
                addLog('error', `Failed to stop process: ${error.message}`);
            }
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setIsLoading(false);
        addLog('info', 'Execution stopped by user');
    };

    const clearLogs = () => {
        setLogs([]);
        setResult(null);
        setError(null);
        setCurrentPid(null);

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsLoading(false);
    };

    return {
        logs,
        isLoading,
        result,
        error,
        currentPid,
        setError,
        executeCommand,
        stopExecution,
        clearLogs,
        addLog
    };
};