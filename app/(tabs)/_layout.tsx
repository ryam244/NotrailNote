import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, icons } from '@/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.surface.light,
          borderTopColor: colors.border.light,
          paddingTop: 8,
          height: 83,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ファイル',
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="folder"
              size={icons.size.md}
              color={color}
              strokeWidth={focused ? 2 : icons.strokeWidth}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '履歴',
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="clock"
              size={icons.size.md}
              color={color}
              strokeWidth={focused ? 2 : icons.strokeWidth}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '検索',
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="search"
              size={icons.size.md}
              color={color}
              strokeWidth={focused ? 2 : icons.strokeWidth}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="settings"
              size={icons.size.md}
              color={color}
              strokeWidth={focused ? 2 : icons.strokeWidth}
            />
          ),
        }}
      />
    </Tabs>
  );
}
