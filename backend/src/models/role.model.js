class Role {
    constructor({ id, code, name, description, created_at}) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.created_at = created_at
    }

    toJSON() {
        return {
            id: this.id,
            code: this.code,
            name: this.name,
            description: this.description,
            created_at: this.created_at
        }
    }
}

module.exports = Role