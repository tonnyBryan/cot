import React from 'react';
import { View, Text } from 'react-native';

function splitTextWithLists(text) {
    const lines = text.split('\n');
    const blocks = [];
    let currentText = [];
    let currentList = null;

    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('*')) {
            if (currentText.length) {
                blocks.push({ type: 'text', content: currentText.join('\n') });
                currentText = [];
            }
            if (currentList) blocks.push({ type: 'list', content: currentList });
            currentList = { title: trimmed.replace(/^\*\s*/, ''), items: [] };
        } else if (trimmed.startsWith('+') && currentList) {
            currentList.items.push(trimmed.replace(/^\+\s*/, ''));
        } else {
            if (currentList) {
                blocks.push({ type: 'list', content: currentList });
                currentList = null;
            }
            currentText.push(trimmed);
        }
    }

    if (currentList) blocks.push({ type: 'list', content: currentList });
    if (currentText.length) blocks.push({ type: 'text', content: currentText.join('\n') });

    return blocks;
}


function IAParsedMessage({ text }) {
    const blocks = splitTextWithLists(text);

    return (
        <View>
            {blocks.map((block, index) => {
                if (block.type === 'text') {
                    return (
                        <Text key={index} style={{ fontSize: 15, color: '#333', marginBottom: 6 }}>
                            {block.content}
                        </Text>
                    );
                } else if (block.type === 'list') {
                    return (
                        <View key={index} style={{
                            backgroundColor: '#f2f2f2',
                            borderRadius: 10,
                            padding: 10,
                            marginBottom: 10
                        }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>
                                {block.content.title}
                            </Text>
                            {block.content.items.map((item, i) => (
                                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                                    <Text style={{ marginRight: 6, fontSize: 16 }}>•</Text>
                                    <Text style={{ fontSize: 15, color: '#333' }}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    );
                }
            })}
        </View>
    );
}

export default IAParsedMessage;
