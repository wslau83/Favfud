import React from 'react';
import moment from "moment";

const API_HOST = 'http://django-fyp.herokuapp.com/';
const GET_MULTIPLE_RECIPES_URL = `${API_HOST}recsys/recipe/id/ids`;
const GET_MEAL_URL = 'https://favfud-app.herokuapp.com/api/diary/meal?user=';

const nutritionLimit = {
  energy: 2200/3,
  carb: 200/3,
  fat: 76.6/3,
  protein: 72/3,
};

const maxConsumptionPercentage=1.4;
const minConsumptionPercentage=0.6;
const maxConsumptionPercentage_l2=1.2;
const minConsumptionPercentage_l2=0.8;

export async function fetchMealRecordByToken(token) {
  try {
    let response = await fetch(`${GET_MEAL_URL}${token}`);
    let responseJson = await response.json();
    return responseJson;
  } catch(err) {
    console.log("fetchMealRecordByToken");
    console.log(err);
  }
}

export function updateMealRecords(meal, mealRecords={}) {
  for (var i=0; i<meal.length; i++) {
    let item = meal[i];
    if (mealRecords.hasOwnProperty(item.date)) {
      mealRecords[item.date][item.dish_id] = item.servings;
    } else {
      mealRecords[item.date] =  {
        [item.dish_id]: item.servings,
      };
    }
  }
  return mealRecords;
}

export async function fetchMealRecipes(mealRecords, date) {
  let ids_str ='';
  let ids = Object.keys(mealRecords[date]);
  ids_str = ids.join(',')
  try {
    let response = await fetch(GET_MULTIPLE_RECIPES_URL, {
        headers: new Headers ({
            ids: ids_str
        }),
    });
    let responseJson = await response.json();
    return responseJson;
  } catch(err) {
    console.log(err);
  }
}

export async function updateMealRecipes(date, mealRecords, mealRecipes={}){
  if(mealRecords[date].length != 0 && mealRecords[date] != undefined) {
    let responseJson = await fetchMealRecipes(mealRecords, date);
    return {[date]: responseJson};
  } else {
    return mealRecipes;
  }
}

export async function generateMealRecipes(mealRecords){
  let mealRecipes={};
  let dates = Object.keys(mealRecords).sort().reverse();
  for (let i = 0; i < dates.length; i++) {
    let new_mealRecipes = await updateMealRecipes(dates[i], mealRecords);
    mealRecipes = Object.assign(mealRecipes, new_mealRecipes);
  }
  return mealRecipes;
}

export function generateReportInfo(mealRecords, mealRecipes, startDate=moment(today).subtract(6, 'days'), endDate=moment(today)){
  let new_reportInfo = {
    numOfDays: 0,
    numOfMeals: 0,
    energy: 0.0,
    fat: 0.0,
    carb: 0.0,
    protein: 0.0,
  };

  new_reportInfo.numOfDays = endDate.diff(startDate, 'days') + 1;
  let dates = Object.keys(mealRecipes);
  for (var i=0; i<dates.length; i++) {
    let date = dates[i];

    let dateInRange = true;
    if(moment(date).isBefore(startDate)){
      dateInRange =  false;
    } else if (moment(date).isAfter(endDate)) {
      dateInRange = false;
    }

    if(dateInRange) {
      let ids = Object.keys(mealRecords[date]);
      for (var j=0; j<mealRecipes[date].length; j++) {
        new_reportInfo.numOfMeals += 1;
        let dish = mealRecipes[date][j];
        let servings = mealRecords[date][dish.id];
        storeNutritionInfo(dish, servings, new_reportInfo);
      }
    }
  }
  return new_reportInfo;
}

export function storeNutritionInfo(dish, servings, new_reportInfo){
  new_reportInfo.carb += parseFloat(dish.chocdf.split("$")[0])*servings;
  new_reportInfo.energy += parseFloat(dish.enerc_kcal.split("$")[0])*servings;
  new_reportInfo.fat += parseFloat(dish.fat.split("$")[0])*servings;
  new_reportInfo.protein += parseFloat(dish.procnt.split("$")[0])*servings;
}

export function getConsumptionPerMeal(reportInfo) {
  var consumptionPerMeal = {
    energy: reportInfo.energy/reportInfo.numOfMeals,
    carb: reportInfo.carb/reportInfo.numOfMeals,
    fat: reportInfo.fat/reportInfo.numOfMeals,
    protein: reportInfo.protein/reportInfo.numOfMeals,
  };
  return consumptionPerMeal;
}

export function getNutritionLimit() {
  return nutritionLimit;
}

export function getConsumptionPercentage(nutrition, consumptionPerMeal, limit=nutritionLimit) {
  switch (nutrition) {
    case "energy":
      return(consumptionPerMeal.energy/limit.energy);
      break;
    case "carb":
      return(consumptionPerMeal.carb/limit.carb);
      break;;
    case "fat":
      return(consumptionPerMeal.fat/limit.fat);
      break;;
    case "protein":
      return(consumptionPerMeal.protein/limit.protein);
      break;
    default:
    return 0;
  }
}

export function generateSummary(consumptionPerMeal, limit=nutritionLimit) {
  var nutritionList = Object.keys(consumptionPerMeal);
  var summary = {
    more: [],
    less: [],
    slightlyMore: [],
    slightlyLess: [],
    noChange:[],
    text: "",
  };
  nutritionList.forEach(nutrition => {
    console.log(nutrition);
    var consumptionPercentage = getConsumptionPercentage(nutrition, consumptionPerMeal, limit);
    if (consumptionPercentage<=minConsumptionPercentage) {
      summary.more.push(nutrition);
    } else if (consumptionPercentage>=maxConsumptionPercentage) {
      summary.less.push(nutrition);
    } else if (consumptionPercentage<=minConsumptionPercentage_l2) {
      summary.slightlyMore.push(nutrition);
    } else if (consumptionPercentage>=maxConsumptionPercentage_l2) {
      summary.slightlyLess.push(nutrition);
    } else {
      summary.noChange.push(nutrition);
    }
  });
  summary.text = generateSummaryText(summary);
  return summary;
}

function generateSummaryText(summary){
  var text="";
  var more_num = summary.more.length;
  var less_num = summary.less.length;
  for (var i=0; i<summary.more.length; i++) {

  }
  if((more_num+less_num)==0) {
    text = "Your eating habbit is healthy. Keep it Up!";
  } else if (less_num==0) {
    text = "You should eat food with more "+changeNutritionToText(summary.more)+".";
  } else if (more_num==0) {
    text = "You should eat food with less "+changeNutritionToText(summary.less)+".";
  } else {
    text = "You should eat food with more "+changeNutritionToText(summary.more)+" and with less "+changeNutritionToText(summary.less)+".";
  }
  return text;
}

function changeNutritionToText(nutritionList) {
  var length = nutritionList.length;
  if (length ==0){
    return "";
  } else {
    var text = "";
    for (var i=0; i<length; i++) {
      var word = nutritionList[i];
      if (word=="carb") {word = "carbohydrates";}
      if (i==length-1) {
       text += word;
      } else if (i==length-2) {
       text += word;
       text += " and ";
      }
       else {
        text += word;
        text += ", ";
      }
    }
    return text;
  }
}

export async function getDiarySummary(token, startDate=moment(new Date).subtract(6, 'days'), endDate=moment(new Date)) {
  let responseJson = await fetchMealRecordByToken(token);
  let mealRecords = updateMealRecords(responseJson);
  let mealRecipes = await generateMealRecipes(mealRecords);
  let reportInfo = generateReportInfo(mealRecords, mealRecipes, startDate, endDate)
  let consumptionPerMeal = getConsumptionPerMeal(reportInfo)
  let summary = generateSummary(consumptionPerMeal);
  return summary;
}

export function getDiarySummaryWithReportInfo(reportInfo) {
  let consumptionPerMeal = getConsumptionPerMeal(reportInfo)
  let summary = generateSummary(consumptionPerMeal);
  return summary;
}
