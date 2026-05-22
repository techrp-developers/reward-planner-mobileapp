import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Enable LayoutAnimation for smooth expansion
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItemData {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    title: string;
    data: FAQItemData[];
    gradientColors?: string[];
    gradientAngle?: number;
}

const FAQItem = ({ item }: { item: FAQItemData }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={styles.itemWrapper}>
            <TouchableOpacity style={styles.itemHeader} onPress={toggle} activeOpacity={0.7}>
                <Text style={styles.toggleIcon}>
                    {isExpanded ? '-' : '+'}
                </Text>
                <Text style={styles.questionText}>{item.question}</Text>
            </TouchableOpacity>
            {isExpanded && (
                <View style={styles.answerBox}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                </View>
            )}
        </View>
    );
};

const FAQSection: React.FC<FAQSectionProps> = ({
    title,
    data,
    gradientColors = ['#FFF2B2', '#FFFEFF', '#FEFDFF'] 
}) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.headerGradient}
            >
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={styles.blueBubble}>
                    <Text style={styles.bubbleText}>?</Text>
                </View>
            </LinearGradient>

            <View style={styles.listContainer}>
                {data.map((item, index) => (
                    <FAQItem key={index} item={item} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 16,
        borderRadius: 20,
        backgroundColor: '#FFF',
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    headerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#374151',
        flex: 1,
    },
    listContainer: {
        backgroundColor: '#FFFFFF',
    },

    blueBubble: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#5A78FF', // Matches blue bubble in images
        justifyContent: 'center',
        alignItems: 'center',
    },
    bubbleText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    itemWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    itemHeader: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    toggleIcon: {
        fontSize: 20,
        color: '#9CA3AF',
        width: 28,
        fontWeight: '300',
    },
    questionText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        flex: 1,
    },
    answerBox: {
        paddingLeft: 44,
        paddingRight: 16,
        paddingBottom: 16,
        backgroundColor: '#F9FAFB',
    },
    answerText: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
});

export default FAQSection;