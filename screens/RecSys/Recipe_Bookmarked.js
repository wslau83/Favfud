import React, { Component } from 'react';
import { Dimensions, StyleSheet, View, ActivityIndicator, FlatList, AsyncStorage, TouchableOpacity, Image} from 'react-native';
import { Row, } from "react-native-easy-grid";
import * as func from './Recipe_Functions.js';
import { Text } from '@shoutem/ui';

const SCREEN_WIDTH = Dimensions.get('window').width - 40;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const ASYNC_STORAGE_KEYS_FOR_USER_TOKEN = 'user_token';
const ASYNC_STORAGE_KEYS_FOR_BOOKMARKED_RECIPE = 'bookmarked_recipe';
const API_HOST = 'http://django-fyp.herokuapp.com/';
const GET_MULTIPLE_RECIPES_URL = `${API_HOST}recsys/recipe/id/ids`;
const EQUIRE_BOOKMARKED_URL = `${API_HOST}recsys/interaction/enquire/bookmark/`;

export default class Recipe_Bookmarked extends Component {

    static navigationOptions = {
        title: 'Bookmarked Recipes',
    };
  
    constructor(props){
      super(props);
      this.state = { 
        isLoading: true,
        isRefreshing: false,
        dataSource: [],
        bookmarked_recipe_ids: '',
        hasScrolled: false,
        user_token: '',
      }
    }

    componentWillMount() {
        AsyncStorage.getItem(ASYNC_STORAGE_KEYS_FOR_USER_TOKEN)
        .then((ut) => {
            if(ut){
                this.setState({user_token: ut});
                AsyncStorage.getItem(ASYNC_STORAGE_KEYS_FOR_BOOKMARKED_RECIPE)
                .then((recipes) => {
                    const r = recipes ? JSON.parse(recipes) : [];
                    if(r.length != 0 && r.join(',') != this.state.bookmarked_recipe_ids){
                        ids_str = r.join(',');
                        this.setState({bookmarked_recipe_ids: ids_str});
                        this.fetchData(this.state.bookmarked_recipe_ids);
                    } else {
                        this.setState({
                            isLoading: false,
                        });
                    }
                });
            }
        });
    }

    getRefreshedData() {
        AsyncStorage.getItem(ASYNC_STORAGE_KEYS_FOR_BOOKMARKED_RECIPE)
        .then((recipes) => {
            const r1 = recipes ? JSON.parse(recipes) : [];
            r2 = this.state.bookmarked_recipe_ids.split(',');
            diff_ids = func.arr_diff(r1, r2);
            if(diff_ids["more"].length != 0) {
                this.setState({bookmarked_recipe_ids: r1.join(',')});
                ids_str = diff_ids["more"].join(',');
                this.fetchData(ids_str);
            }
            if(diff_ids["less"].length != 0) {
                this.setState({bookmarked_recipe_ids: r1.join(',')});
                for(var i = 0; i < diff_ids["less"].length; i++){
                    this.setState({ dataSource: this.state.dataSource.filter(function(rec) {return rec.id != diff_ids["less"][i];}) });
                };
            }
        });
    }

    fetchData(recipe_ids) {
        return fetch(GET_MULTIPLE_RECIPES_URL, {
            headers: new Headers ({
                ids: recipe_ids
            }),
        })
        .then((response) => response.json())
        .then((responseJson) => {
          this.setState({
            dataSource: [...this.state.dataSource, ...responseJson],
            isLoading: false,
          });
  
        })
        .catch((error) =>{
          console.error(error);
        });
    }

    handleOnScroll() {
        this.setState({hasScrolled: true});
    }

    refresh() {
        this.setState({ isRefreshing: true });
        this.getRefreshedData();
        this.setState({ isRefreshing: false });
    }

    renderBookmarkedRecipes() {
        const {navigate} = this.props.navigation;
        data = this.state.dataSource;
        if(data.length == 0){
            return(
                <View style={styles.center}>
                    <Text style={styles.remind_text}>There is no bookmarked recipe</Text>
                    <Text style={styles.remind_text}>at this moment.</Text>
                </View>
            );
        } else {
            return(
                <FlatList
                    data={data}
                    onRefresh={() => this.refresh()}
                    refreshing={this.state.isRefreshing}
                    onScroll={this.handleOnScroll.bind(this)}
                    scrollEventThrottle={500}
                    numColumns={2}
                    renderItem={({ item: rowData }) => {
                      return(
                          <View style={styles.recipe_view}>
                            <TouchableOpacity 
                            key={rowData.id} 
                            onPress={() => navigate({routeName: 'Recipe_Information', params: {recipe: rowData, user_token: this.state.user_token}, key: 'Info'+rowData.id})}
                            >
                            <Image
                                style={styles.recipe_image}
                                source={{uri: rowData.imageurlsbysize_360}}
                            />
                            <Row style={{height: 50, width: styles.recipe_image.width, flexDirection:'row'}}>
                                <Text numberOfLines={2} style={{flex: 1, flexWrap: 'wrap'}}>
                                {rowData.recipe_name}
                                </Text>
                            </Row>
                            </TouchableOpacity>
                          </View>
                      );
                    }}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={[{width: SCREEN_WIDTH + 40, marginBottom: 30,}, styles.center]}
                />
            );
        }
    }

    render() {
        if (this.state.isLoading) {
            return(
                <View style={styles.screen_view}>
                    <Text>Loading...</Text>
                    <ActivityIndicator/>
                </View>
            )
        } else {
            return(
                <View style={styles.screen_view}>
                    {this.renderBookmarkedRecipes()}
                </View>
            );
        }
    }
  
  }
  
  const styles = StyleSheet.create({
    screen_view: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    remind_text: {
        fontSize: 20,
        color: 'gray',
    },
    recipe_view: {
        margin: 15,
        marginTop: 20,
        width: SCREEN_WIDTH/2-20,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        justifyContent: 'center',
    },
    recipe_image: {
        marginBottom: 5,
        width: SCREEN_WIDTH/2-20,
        height: SCREEN_WIDTH/2-20,
        backgroundColor: 'transparent',
        borderRadius: 25,
    },
    recipe_text: {
        marginBottom: 10,
        textAlignVertical: "center",
        textAlign: 'center',
        backgroundColor: 'transparent',
    },
  });
  