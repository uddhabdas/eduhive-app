import React from 'react' ;
import { View } from 'react-native' ;
import AppText from '../../components/atoms/AppText' ;
import Screen from '../../components/layout/Screen' ;

export default function ExploreScreen( ) {
  return  (
    <Screen >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center ' }}>
        <AppText variant="sectionTitle" weight="bold" >
          Explore Page Coming Soon 
        </AppText >
      </View >
    </Screen >
  );
}
