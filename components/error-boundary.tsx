import React, { ReactNode } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { firebaseAnalytics } from "@/lib/firebase-config";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

/**
 * Error Boundary Component
 * Catches errors and reports them to Firebase Crashlytics
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Firebase
    firebaseAnalytics.trackCrash(error);

    // Store error info
    this.setState({
      errorInfo: (errorInfo.componentStack ?? null) as string | null,
    });

    // Log to console for development only
    if (__DEV__) {
      console.error("Error Boundary caught an error:", error);
      console.error("Error Info:", errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-background p-4 justify-center">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View className="gap-4">
              {/* Error Icon */}
              <View className="items-center">
                <Text className="text-6xl mb-4">⚠️</Text>
                <Text className="text-2xl font-bold text-foreground text-center">
                  Oops! Something went wrong
                </Text>
              </View>

              {/* Error Message */}
              <View className="bg-error/10 border border-error/20 rounded-lg p-4 gap-2">
                <Text className="text-error font-semibold">Error Details:</Text>
                <Text className="text-error text-sm">
                  {this.state.error?.message || "Unknown error"}
                </Text>
              </View>

              {/* Error Stack (Development Only) */}
              {__DEV__ && this.state.errorInfo && (
                <View className="bg-surface border border-border rounded-lg p-4 gap-2">
                  <Text className="text-foreground font-semibold text-xs">
                    Stack Trace:
                  </Text>
                  <Text className="text-muted text-xs font-mono">
                    {this.state.errorInfo}
                  </Text>
                </View>
              )}

              {/* Help Text */}
              <View className="bg-surface rounded-lg p-4 gap-2">
                <Text className="text-foreground font-semibold">What can you do?</Text>
                <Text className="text-muted text-sm">
                  • Try restarting the app{"\n"}
                  • Clear app cache and data{"\n"}
                  • Update to the latest version{"\n"}
                  • Contact support if the problem persists
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="gap-3 mt-4">
                <Pressable
                  onPress={this.handleReset}
                  className="bg-primary px-6 py-3 rounded-full items-center active:opacity-80"
                >
                  <Text className="text-background font-semibold">Try Again</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    // In a real app, this would navigate to home or settings
                    this.handleReset();
                  }}
                  className="bg-surface border border-border px-6 py-3 rounded-full items-center active:opacity-80"
                >
                  <Text className="text-foreground font-semibold">Go Home</Text>
                </Pressable>
              </View>

              {/* Error Code */}
              {__DEV__ && (
                <View className="items-center mt-4">
                  <Text className="text-muted text-xs">
                    Error Code: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
