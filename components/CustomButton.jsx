import { Text, View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import React from 'react'

const CustomButton = ({ 
  title, 
  handlePress, 
  style, 
  titleStyle,
  isLoading, 
  disabled,
  iconLeft,
  iconRight,
  variant = 'filled' 
}) => {
  const buttonStyles = [
    styles.button,
    variant === 'outlined' && styles.outlinedButton,
    disabled && styles.disabledButton,
    style // Custom styles passed as props
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'outlined' && styles.outlinedButtonText,
    disabled && styles.disabledButtonText,
    titleStyle // Custom text styles passed as props
  ];

  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={handlePress} 
      activeOpacity={0.7}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <ActivityIndicator size='small' color="#fff" />
      ) : (
        <View style={styles.buttonContent}>
          {iconLeft}
          <Text style={textStyles}>{title}</Text>
          {iconRight}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF9C01', // Secondary color
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF9C01',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  outlinedButtonText: {
    color: '#FF9C01',
  },
  disabledButtonText: {
    color: '#666666',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default CustomButton