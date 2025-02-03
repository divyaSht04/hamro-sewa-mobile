import { View, ScrollView } from 'react-native'
import React from 'react'
import "../global.css"
import { SafeAreaView } from 'react-native-safe-area-context'

const Index = () => {
  return (
    <SafeAreaView className='flex-1 items-center justify-center'>
      <ScrollView>
        <View className="w-full justify-center items-center min-h-[85vh] px-4">

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Index