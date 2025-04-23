import React from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

/**
 * Reusable form field component with icon support
 * @param {string} label - Field label
 * @param {string} placeholder - Input placeholder text
 * @param {string} value - Current input value
 * @param {function} onChangeText - Function to call on text change
 * @param {string} keyboardType - Keyboard type (default, number-pad, email-address, etc)
 * @param {boolean} isPassword - Whether the field is for password entry
 * @param {string} iconName - Name of the icon to display
 * @param {string} iconType - Type of icon (Ionicons, MaterialIcons, or FontAwesome)
 * @param {string} errorText - Error message to display
 * @param {boolean} secure - Whether the field should be secure entry (for passwords)
 * @param {function} onTogglePassword - Function to toggle password visibility
 * @param {boolean} showPassword - Whether to show password text
 */
const FormField = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  isPassword = false,
  iconName,
  iconType = 'Ionicons',
  errorText,
  secure,
  onTogglePassword,
  showPassword,
  ...rest
}) => {
  // Render the appropriate icon based on iconType
  const renderIcon = () => {
    if (!iconName) return null;
    
    const iconSize = 20;
    const iconColor = '#888';
    
    switch (iconType) {
      case 'MaterialIcons':
        return <MaterialIcons name={iconName} size={iconSize} color={iconColor} />;
      case 'FontAwesome':
        return <FontAwesome name={iconName} size={iconSize} color={iconColor} />;
      case 'Ionicons':
      default:
        return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
    }
  };

  return (
    <View className="mb-4">
      {label && <Text className="text-gray-700 font-medium mb-1">{label}</Text>}
      
      <View className="flex-row items-center relative border border-gray-300 rounded-lg overflow-hidden bg-white">
        {iconName && (
          <View className="pl-3 pr-1">
            {renderIcon()}
          </View>
        )}
        
        <TextInput
          className={`p-3 flex-1 text-base ${iconName ? 'pl-1' : 'pl-3'}`}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={isPassword && !showPassword}
          {...rest}
        />
        
        {isPassword && (
          <TouchableOpacity 
            onPress={onTogglePassword}
            className="pr-3"
          >
            <Ionicons 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color="#888" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {errorText && (
        <Text className="text-red-500 text-sm mt-1">{errorText}</Text>
      )}
    </View>
  );
};

export default FormField;
