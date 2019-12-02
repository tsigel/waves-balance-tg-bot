import { readJSON, outputJSON } from 'fs-extra';
import { join } from 'path';


export class Storage {

    private _path = join(__dirname, '..', 'storage.json');

    public read(key: string): Promise<any> {
        return this._read()
            .then(data => data[key]);
    }

    public write(key: string, value: any): Promise<void> {
        return this._read()
            .then(data => outputJSON(this._path, Object.assign(data, { [key]: value })));
    }

    private _read(): Promise<any> {
        return readJSON(this._path)
            .catch(() => Object.create(null))
    }
}
