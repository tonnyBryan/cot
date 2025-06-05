import React, {useState, useRef, useEffect, useContext} from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    ScrollView,
    Pressable, Dimensions, Animated, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import IAContext, {getSystemMessage} from "../chatbot/IAStatic";
import LottieView from 'lottie-react-native';
import {SessionContext} from "../context/SessionProvider";
import {loadAppData} from "../utils/storage";
import IAParsedMessage from '../chatbot/IAParsedMessage';
import {convertToNoSQL, regrouperParFamille} from "../utils/func";
import IASidebarHelp from '../components/IASidebarHelp';




export default function IAScreen() {
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState([]);
    const scrollViewRef = useRef();
    const [isTyping, setIsTyping] = useState(false);
    const { getSession } = useContext(SessionContext);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
    const currentProject = getSession('currentProject');


    const toggleSidebar = () => {
        const toValue = sidebarVisible ? -Dimensions.get('window').width : 0;

        if (!sidebarVisible) {
            Keyboard.dismiss();
        }

        Animated.timing(slideAnim, {
            toValue,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            setSidebarVisible(!sidebarVisible);
        });
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userText = inputText.trim();
        const newUserMessage = { sender: 'user', text: userText };
        const updatedMessages = [...messages, newUserMessage];

        setMessages(updatedMessages);
        setInputText('');

        try {
            setIsTyping(true);

            const appData = await loadAppData(currentProject.data_storage_key);

            const systemMessage = {
                role: 'system',
                content: getSystemMessage(IAContext, currentProject, regrouperParFamille(appData))
            };

            const formattedMessages = [
                systemMessage,
                ...updatedMessages.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }))
            ];

            // const formattedMessages = updatedMessages.map(msg => ({
            //     role: msg.sender === 'user' ? 'user' : 'assistant',
            //     content: msg.text
            // }));

            const response = await fetch(IAContext.api_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${IAContext.api_token}`
                },
                body: JSON.stringify({
                    model: IAContext.ai_model,
                    messages: formattedMessages
                })
                // body: JSON.stringify({
                //     model: "llama3-8b-8192",
                //     temperature: 0.3,
                //     max_tokens: 500,
                //     top_p: 1,
                //     stream: false,
                //     messages: formattedMessages
                // })
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status}`);
            }

            const data = await response.json();

            const message = data.choices?.[0]?.message;
            const botReply = message?.content?.trim() || message?.reasoning?.trim() || "Réponse vide.";

            const botMessage = { sender: 'bot', text: botReply };
            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        } catch (error) {
            console.error("Erreur API :", error);
            setMessages(prev => [
                ...prev,
                { sender: 'bot', text: "❌ Une erreur est survenue lors de l'appel à l'IA." }
            ]);
            setIsTyping(false);
        }
    };


    useEffect(() => {
        // Scroll vers le bas quand les messages changent
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    return (
        <KeyboardAvoidingView
            style={styles.wrapper}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

                <View style={styles.container}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.title}>{IAContext.aiName}</Text>
                            <LottieView
                                source={require('../animation/bot.json')}
                                autoPlay
                                loop
                                style={{ width: 35, height: 35, bottom: 8, right: 15 }}
                            />
                        </View>

                        <TouchableOpacity style={{ bottom: 8 , right: 5 }} onPress={toggleSidebar}>
                            <Ionicons  name="help-circle-outline" size={35} color="#4068a1" />
                        </TouchableOpacity>
                    </View>


                    <ScrollView
                        style={styles.chatContainer}
                        contentContainerStyle={styles.chatContent}
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        keyboardDismissMode="on-drag"
                    >
                        {messages.length === 0 && (
                            <View style={{ alignItems: 'center', marginVertical: 20 }}>
                                <LottieView
                                    source={require('../animation/bot-full2.json')}
                                    autoPlay
                                    loop
                                    style={{ width: 150, height: 150 }}
                                />
                                <Text style={styles.placeholderText}>
                                    Commencez à discuter avec{' '}
                                    <Text style={styles.aiNameUnique}>{IAContext.aiName}</Text>
                                </Text>
                            </View>
                        )}

                        {messages.map((msg, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.messageBubble,
                                    msg.sender === 'user'
                                        ? styles.userBubble
                                        : styles.botBubble
                                ]}
                            >
                                <Text style={[
                                    styles.senderText,
                                    msg.sender === 'user' ? styles.userSender : styles.botSender
                                ]}>
                                    {msg.sender === 'user' ? 'Vous 🧑' : `🤖 ${IAContext.aiName}`}
                                </Text>

                                {/*
                                <Text style={[
                                    styles.messageText,
                                    msg.sender === 'user' && { color: '#fff' }
                                ]}>
                                    {msg.text}
                                </Text>
                                */}

                                {msg.sender === 'bot' ? (
                                    <IAParsedMessage text={msg.text} />
                                ) : (
                                    <Text style={[
                                        styles.messageText,
                                        { color: '#fff' }
                                    ]}>
                                        {msg.text}
                                    </Text>
                                )}

                            </View>
                        ))}
                        {isTyping && (
                            <View style={[styles.messageBubble, styles.botBubble]}>
                                <Text style={styles.senderText}>🤖 CotAi</Text>
                                <Text style={[styles.messageText, { fontStyle: 'italic' }]}>
                                    <LottieView
                                        source={require('../animation/dots.json')}
                                        autoPlay
                                        loop
                                        style={{
                                            width: 60,
                                            height: 20,
                                            transform: [{ scale: 4 }]
                                        }}
                                    />
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Barre de saisie fixe en bas */}
                    <View style={styles.inputBar}>
                        <TextInput
                            style={styles.input}
                            placeholder="Posez une question..."
                            placeholderTextColor="#888"
                            multiline
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        <Pressable
                            style={styles.sendButton}
                            onPress={handleSend}
                            disabled={!inputText.trim() || sidebarVisible} // <- désactivé si texte vide ou sidebar ouvert
                        >
                            <Ionicons name="send" size={22} color="#fff" />
                        </Pressable>
                    </View>
                </View>
            </TouchableWithoutFeedback>
            <IASidebarHelp visible={sidebarVisible} onClose={toggleSidebar} slideAnim={slideAnim} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    aiNameUnique: {
        fontWeight: '700',
    },

    senderText: {
        fontSize: 12,
        marginBottom: 4,
    },
    userSender: {
        color: '#cce6ff', // clair sur fond bleu
        textAlign: 'right',
    },
    botSender: {
        color: '#555',
        textAlign: 'left',
    },

    wrapper: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    container: {
        paddingTop: 50,
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: '#f7f7f7',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    chatContainer: {
        flex: 1,
        backgroundColor: '#fff',  // Changé de bleu à blanc
    },
    chatContent: {
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    placeholderText: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        maxWidth: '80%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#4068a1',
    },
    botBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#e5e5ea',
    },
    messageText: {
        fontSize: 16,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        fontSize: 16,
    },
    sendButton: {
        marginLeft: 8,
        backgroundColor: '#4068a1',
        padding: 10,
        borderRadius: 20,
    },
});