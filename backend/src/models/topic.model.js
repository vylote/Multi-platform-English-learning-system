class Topic {
  constructor({
    id,
    title,
    description
  }) {
    this.id = id ?? null;
    this.title = title;
    this.description = description
  }

  toJSON() {
    const json = {
        id: this.id,
        title: this.title,
        description: this.description
    }

    return json;
  }
}

module.exports = Topic