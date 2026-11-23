import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { HealthStackParamList } from "./types";
import HomeScreen from "../components/screens/HomeScreen";
import ProvidersScreen from "../components/screens/ProvidersScreen";
import EventsScreen from "../components/screens/EventsScreen";
import BloodTestScreen from "../components/screens/BloodTestScreen";
import FullBodyScreen from "../components/screens/FullBodyScreen";
import XRAYScreen from "../components/screens/XRAYScreen";
import SpecializedGoalsScreen from "../components/screens/SpecializedGoalsScreen";
import UpcomingEvenetsScreen from "../components/screens/UpcomingEvenetsScreen";
import BookAppointment from "../components/screens/BookAppointment";

const Stack = createNativeStackNavigator<HealthStackParamList>();

export default function HealthHomeStack() {
  return (
    <Stack.Navigator
      id="HealthHomeStack"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ProvidersScreen" component={ProvidersScreen} />
      <Stack.Screen name="EventsScreen" component={EventsScreen} />
      <Stack.Screen name="BloodTestScreen" component={BloodTestScreen} />
      <Stack.Screen name="FullBodyScreen" component={FullBodyScreen} />
      <Stack.Screen name="XRAYScreen" component={XRAYScreen} />
      <Stack.Screen
        name="SpecializedGoalsScreen"
        component={SpecializedGoalsScreen}
      />
      <Stack.Screen
        name="UpcomingEvenetsScreen"
        component={UpcomingEvenetsScreen}
      />
      <Stack.Screen name="BookAppointment" component={BookAppointment} />
    </Stack.Navigator>
  );
}
