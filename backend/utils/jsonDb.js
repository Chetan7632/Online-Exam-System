import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.VERCEL
  ? '/tmp'
  : path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonModel {
  constructor(modelName) {
    this.modelName = modelName.toLowerCase() + 's';
    this.filePath = path.join(DATA_DIR, `${this.modelName}.json`);
    this.initFile();
  }

  initFile() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  read() {
    try {
      this.initFile();
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error(`Error reading ${this.modelName}:`, e);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error writing ${this.modelName}:`, e);
    }
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async find(filter = {}) {
    const data = this.read();
    let results = data.filter(item => {
      for (let key in filter) {
        if (filter[key] !== undefined && item[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });

    // Return custom chainable object to simulate Mongoose `.populate`
    return new QueryChain(results);
  }

  async findOne(filter = {}) {
    const data = this.read();
    const result = data.find(item => {
      for (let key in filter) {
        if (filter[key] !== undefined && item[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
    return result ? new DocumentInstance(this, result) : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(docData) {
    const data = this.read();
    const newDoc = {
      _id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...docData
    };
    data.push(newDoc);
    this.write(data);
    return new DocumentInstance(this, newDoc);
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const data = this.read();
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;

    // Handle Mongoose style update operators like $push, $set
    let updatedItem = { ...data[index], updatedAt: new Date().toISOString() };
    
    if (updateData.$push) {
      for (let key in updateData.$push) {
        if (!Array.isArray(updatedItem[key])) {
          updatedItem[key] = [];
        }
        updatedItem[key].push(updateData.$push[key]);
      }
    }
    
    const setFields = updateData.$set || updateData;
    for (let key in setFields) {
      if (key !== '$push') {
        updatedItem[key] = setFields[key];
      }
    }

    data[index] = updatedItem;
    this.write(data);
    return new DocumentInstance(this, updatedItem);
  }

  async findByIdAndDelete(id) {
    const data = this.read();
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;
    const deleted = data.splice(index, 1)[0];
    this.write(data);
    return deleted;
  }
}

class DocumentInstance {
  constructor(model, data) {
    this._model = model;
    Object.assign(this, data);
  }

  async save() {
    const data = this._model.read();
    if (!this._id) {
      this._id = this._model.generateId();
      this.createdAt = new Date().toISOString();
      this.updatedAt = new Date().toISOString();
      data.push(this.toJSON());
    } else {
      const index = data.findIndex(item => item._id === this._id);
      this.updatedAt = new Date().toISOString();
      if (index !== -1) {
        data[index] = this.toJSON();
      } else {
        data.push(this.toJSON());
      }
    }
    this._model.write(data);
    return this;
  }

  toJSON() {
    const copy = { ...this };
    delete copy._model;
    return copy;
  }

  toObject() {
    return this.toJSON();
  }
}

class QueryChain extends Array {
  constructor(items) {
    super(...items);
  }

  populate(path) {
    // Populate simple mappings
    const dbRefs = {
      creator: 'users',
      student: 'users',
      exam: 'exams'
    };

    const targetFile = dbRefs[path];
    if (!targetFile) return this;

    try {
      const refPath = path.join(DATA_DIR, `${targetFile}.json`);
      if (fs.existsSync(refPath)) {
        const refData = JSON.parse(fs.readFileSync(refPath, 'utf-8'));
        this.forEach(item => {
          const idToFind = item[path];
          if (typeof idToFind === 'string') {
            const foundRef = refData.find(r => r._id === idToFind);
            if (foundRef) {
              // Delete password for security if populating a user
              const refCopy = { ...foundRef };
              delete refCopy.password;
              item[path] = refCopy;
            }
          }
        });
      }
    } catch (e) {
      console.error(`Error populating ${path}:`, e);
    }
    return this;
  }
}

// Function to construct local model object matching mongoose usage
export function createJsonModel(modelName) {
  const modelInstance = new JsonModel(modelName);
  
  // Wrap constructor to behave like `new User(...)`
  function ModelConstructor(data) {
    return new DocumentInstance(modelInstance, data);
  }

  // Attach static methods to model constructor
  ModelConstructor.find = (filter) => modelInstance.find(filter);
  ModelConstructor.findOne = (filter) => modelInstance.findOne(filter);
  ModelConstructor.findById = (id) => modelInstance.findById(id);
  ModelConstructor.create = (data) => modelInstance.create(data);
  ModelConstructor.findByIdAndUpdate = (id, update, options) => modelInstance.findByIdAndUpdate(id, update, options);
  ModelConstructor.findByIdAndDelete = (id) => modelInstance.findByIdAndDelete(id);

  return ModelConstructor;
}
