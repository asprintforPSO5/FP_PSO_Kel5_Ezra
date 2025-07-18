import axios from "axios";

export default {
  namespaced: true,
  state() {
    return {
      recipes: [],
      recipeDetail: {},
    };
  },
  getters: {},
  mutations: {
    setRecipeData(state, payload) {
      state.recipes = payload;
    },
    setRecipeDetail(state, payload) {
      state.recipeDetail = payload;
    },
    setNewRecipe(state, payload) {
      state.recipes.push(payload);
    },
  },
  actions: {
    async getRecipeData({ commit }) {
      try {
        const { data } = await axios.get(
          "https://timedoorezra-default-rtdb.firebaseio.com/recipes.json"
        );

        const arr = [];
        for (const key in data) {
          arr.push({ id: key, ...data[key] });
        }
        commit("setRecipeData", arr);
      } catch (err) {
        console.log(err);
      }
    },

    async getRecipeDetail({ commit }, payload) {
      try {
        const { data } = await axios.get(
          `https://timedoorezra-default-rtdb.firebaseio.com/recipes/${payload}.json`
        );
        commit("setRecipeDetail", data);
      } catch (err) {
        console.log(err);
      }
    },

    async addNewRecipe({ commit, rootState }, payload) {
      const newData = {
        ...payload,
        username: rootState.auth.userLogin.username,
        createdAt: Date.now(),
        likes: ["null"],
        userId: rootState.auth.userLogin.userId,
      };

      try {
        const { data } = await axios.post(
          `https://timedoorezra-default-rtdb.firebaseio.com/recipes.json?auth=${rootState.auth.token}`,
          newData
        );

        commit("setNewRecipe", { id: data.name, ...newData });
      } catch (err) {
        console.log(err);
      }
    },

    async deleteRecipe({ dispatch, rootState }, payload) {
      try {
        await axios.delete(
          `https://timedoorezra-default-rtdb.firebaseio.com/recipes/${payload}.json?auth=${rootState.auth.token}`
        );
        await dispatch("getRecipeData");
      } catch (err) {
        console.log(err);
      }
    },

    async updateRecipe({ dispatch, rootState }, { id, newRecipe }) {
      try {
        await axios.put(
          `https://timedoorezra-default-rtdb.firebaseio.com/recipes/${id}.json?auth=${rootState.auth.token}`,
          newRecipe
        );
        await dispatch("getRecipeData");
      } catch (err) {
        console.log(err);
      }
    },

    async toggleFavorite({ rootState, dispatch }, recipeId) {
      const userId = rootState.auth.userLogin.userId;
      if (!userId) {
        console.error("User not logged in!");
        return;
      }

      const token = rootState.auth.token;
      try {
        const response = await axios.get(
          `https://timedoorezra-default-rtdb.firebaseio.com/recipes/${recipeId}.json?auth=${token}`
        );
        const recipeData = response.data;

        if (!recipeData.likes || recipeData.likes.includes("null")) {
          recipeData.likes = [];
        }

        const userIndex = recipeData.likes.indexOf(userId);
        if (userIndex >= 0) {
          recipeData.likes.splice(userIndex, 1);
        } else {
          recipeData.likes.push(userId);
        }

        await axios.patch(
          `https://timedoorezra-default-rtdb.firebaseio.com/recipes/${recipeId}.json?auth=${token}`,
          { likes: recipeData.likes }
        );

        await dispatch("getRecipeDetail", recipeId);
        await dispatch("getRecipeData");
      } catch (err) {
        console.error("Error updating favorite status:", err);
      }
    },
  },
};
