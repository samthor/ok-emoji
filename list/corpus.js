import slugify from 'slugify';

const slugifyOptions = {lower: true, strict: true};

slugify.extend({
  '#': 'hash',
  '*': 'star',
});

export class Corpus {
  #index = {};

  #slug = (name) => {
    const id = slugify(name, slugifyOptions);
    if (!id) {
      throw new Error(`got bad id: ${id}`)
    }
    return id;
  };

  add(name, data) {
    const id = this.#slug(name);
    if (id in this.#index) {
      return false;
    }
    this.#index[id] = data;
    return true;
  }

  link(target, from) {
    const targetId = this.#slug(target);
    const fromId = this.#slug(from);
    if (targetId === fromId) {
      return true;  // self referential
    }

    const existing = this.#index[fromId];
    if (existing !== undefined) {
      if (existing === targetId) {
        return true;  // no change
      }
      return false;
    }
    this.#index[fromId] = targetId;
    return true;
  }

  all() {
    return this.#index;
  }
}