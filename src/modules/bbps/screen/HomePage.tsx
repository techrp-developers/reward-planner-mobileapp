import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import RechargeBill from '../component/home/ReachargeBill';

function HomePageComponent() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <RechargeBill />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  content: {
    paddingBottom: 24,
  },
});

export default React.memo(HomePageComponent);
