// for babel configuration
import "core-js/stable";
import "regenerator-runtime/runtime";

import Search from "./models/search";
import Recipe from "./models/recipe";
import List from "./models/list";
import Likes from "./models/likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";

/* Global state of the app
 * => Search Object
 * => Current Recipe Object
 * => Shopping List Object
 * => Liked Recipes
 */

const state = {};

/*
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
  // 1) Get query from View
  const query = searchView.getInput();
  if (query) {
    // 2) New search object and add to state
    state.search = new Search(query);

    // 3) Prepare UI for result
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try {
      // 4) Search for recipes
      await state.search.getResults();

      // 5) Render result on UI
      clearLoader();
      searchView.renderResults(state.search.recipes);
    } catch (error) {
      clearLoader();
      alert("Something went wrong with search ...");
    }
  }
};

elements.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto);
    searchView.clearResults();
    searchView.renderResults(state.search.recipes, goToPage);
  }
});

/*
 * RECIPE CONTROLLER
 */

const controlRecipe = async () => {
  // get id from URL
  const id = window.location.hash.replace("#", "");

  if (id) {
    // Prepare UI for Changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // Highlights selected search item
    if (state.search) searchView.highlightSelected(id);

    //  Create new Recipe Object
    state.recipe = new Recipe(id);

    try {
      // Get recipe data and parse ingredents
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      // Calcculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      // Render recipe
      clearLoader();
      recipeView.renderRecipe(
        state.recipe,
        state.likes ? state.likes.isLiked(id) : false
      );
    } catch (error) {
      alert("Something went wrong");
    }
  }
};

["hashchange", "load"].forEach((event) =>
  window.addEventListener(event, controlRecipe)
);

/*
 * LIST CONTROLLER
 */
const controlList = () => {
  // Create a new list if there is none yet.
  if (!state.list) state.list = new List();

  // Add each ingredents to the list and UI
  state.recipe.ingredients.forEach((el) => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

// Handle delete and Update list items events
elements.shopping.addEventListener("click", (e) => {
  const id = e.target.closest(".shopping__item").dataset.itemid;

  // Handle the delete button
  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    // Delete from state
    state.list.deleteItem(id);
    // Delete from UI
    listView.deleteItem(id);

    // Handle the count update
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

/*
 * LIKE CONTROLLER
 */
const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  // User has not yet liked the current recipy
  if (!state.likes.isLiked(currentID)) {
    // Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    // Toggle the like button
    likesView.toggleBtn(true);

    // Add like to UI list
    likesView.renderLike(newLike)

    // User has liked the current recipy
  } else {
    // Remove like from the state
    state.likes.deleteLike(currentID);
    // Toggle the unlike button
    likesView.toggleBtn(false);

    // Remove like from UI list
    likesView.deleteLike(currentID);
    console.log(state.likes)
  }
  likesView.toggleLikeMenu(state.likes ? state.likes.getNumLikes() : 0);
};

// Restore liked recipes on pageload
window.addEventListener('load', function() {
  state.likes = new Likes();

  // Restore likes
  state.likes.readStorage();

  // Toggle like menu button
  likesView.toggleLikeMenu(state.likes ? state.likes.getNumLikes() : 0);

  // Render the existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
})

// Handling racipe button click
elements.recipe.addEventListener("click", (e) => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    // Decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    // Increase button is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    // Add ingredents to shopping list
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    // Like controller
    controlLike();
  }
});
