import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import SetupScreen from './src/screens/SetupScreen';
import SupportScreen from './src/screens/SupportScreen';
import { WebPolish } from './src/components/studio';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WebPolish />
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Setup" component={SetupScreen} />
            <Stack.Screen name="Practice" component={PracticeScreen} />
            <Stack.Screen name="Results" component={ResultsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
