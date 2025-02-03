import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'

const Button = ({ title, handlePress, style, isLoading }) => {
    return (
        <TouchableOpacity
            onPress={handlePress}
            className={`bg-orange-500 h-12 rounded-md flex items-center justify-center ${style}`}
            disabled={isLoading}
            activeOpacity={0.7}
        >
            {isLoading ? <ActivityIndicator size='small' color='white' />
                : <Text className='text-white text-lg font-medium'>
                    {title}
                </Text>}
        </TouchableOpacity>
    )
}

export default Button

const styles = StyleSheet.create({})