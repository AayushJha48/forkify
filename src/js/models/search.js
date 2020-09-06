import Axios from "axios";

export default class Search {
  constructor(query) {
    this.query = query;
  }

  async getResults() {
    try {
      const result = await Axios.get(
        `https://forkify-api.herokuapp.com/api/search?q=${this.query}`
      );
      this.recipes = result.data.recipes;
    } catch (error) {
      console.log(error);
    }
  }
}
