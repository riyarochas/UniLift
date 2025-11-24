import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { sendVerificationEmail, verifyEmail } from '../services/api';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailSentTo, setEmailSentTo] = useState('');

  useEffect(() => {
    // Auto-send code when screen loads
    handleSendCode();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (countdown > 0) {
      Alert.alert('Please Wait', `You can resend code in ${countdown} seconds`);
      return;
    }

    setSendingCode(true);
    try {
      const response = await sendVerificationEmail();
      setEmailSentTo(response.data.email);
      Alert.alert(
        'Code Sent! ✉️', 
        `Verification code sent to ${response.data.email}\n\nPlease check your inbox (and spam folder if not found).`
      );
      setCountdown(60); // 60 seconds cooldown
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code from your email');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(code);
      Alert.alert(
        '✅ Verified!', 
        'Your email has been verified successfully!',
        [
          { text: 'Continue', onPress: () => router.replace('/home') }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>✉️</Text>
        <Text style={styles.title}>Verify Your Email</Text>
        
        {emailSentTo ? (
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{'\n'}
            <Text style={styles.email}>{emailSentTo}</Text>
          </Text>
        ) : (
          <Text style={styles.subtitle}>
            We need to verify your college email to ensure you're a student
          </Text>
        )}

        <View style={styles.instructionsBox}>
          <Text style={styles.instructionTitle}>📋 Instructions:</Text>
          <Text style={styles.instructionText}>1. Check your email inbox</Text>
          <Text style={styles.instructionText}>2. Look for email from UniLift</Text>
          <Text style={styles.instructionText}>3. Copy the 6-digit code</Text>
          <Text style={styles.instructionText}>4. Enter it below</Text>
        </View>

        <Text style={styles.label}>Enter 6-Digit Code</Text>
        <TextInput
          style={styles.input}
          placeholder="000000"
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleVerify}
          disabled={loading || code.length !== 6}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Email</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleSendCode}
            disabled={sendingCode || countdown > 0}
          >
            {sendingCode ? (
              <ActivityIndicator size="small" color="#2196F3" />
            ) : (
              <Text style={[
                styles.resendButtonText,
                countdown > 0 && styles.resendButtonTextDisabled
              ]}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>💡 Tips:</Text>
          <Text style={styles.tipText}>• Check spam/junk folder</Text>
          <Text style={styles.tipText}>• Code expires in 15 minutes</Text>
          <Text style={styles.tipText}>• Make sure email address is correct</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  email: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  instructionsBox: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  input: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    fontSize: 28,
    letterSpacing: 10,
    textAlign: 'center',
    width: '100%',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  resendButton: {
    padding: 10,
  },
  resendButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#999',
  },
  tipsBox: {
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
});