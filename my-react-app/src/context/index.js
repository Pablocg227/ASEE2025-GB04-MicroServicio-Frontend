import React, { createContext, useContext, useState } from 'react';

const ExampleContext = createContext();

export const ExampleProvider = ({ children }) => {
    const [exampleState, setExampleState] = useState(null);

    return (
        <ExampleContext.Provider value={{ exampleState, setExampleState }}>
            {children}
        </ExampleContext.Provider>
    );
};

export const useExampleContext = () => {
    return useContext(ExampleContext);
};