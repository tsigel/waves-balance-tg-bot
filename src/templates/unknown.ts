export const unknown = (node: string, tx: any): Promise<string> => {
    return Promise.resolve(JSON.stringify(tx, null, 4));
}