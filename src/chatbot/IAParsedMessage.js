import React from 'react';
import { Text } from 'react-native';

function parseMarkdown(text) {
    const boldPattern = /\*\*(.+?)\*\*/g;
    const italicPattern = /\*(.+?)\*/g;
    const combinedPattern = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;

    const applyMarkdown = (input) => {
        const tokens = [];
        let lastIndex = 0;
        let match;

        while ((match = combinedPattern.exec(input)) !== null) {
            if (match.index > lastIndex) {
                tokens.push({ type: 'text', content: input.slice(lastIndex, match.index) });
            }

            if (match[1].startsWith('**')) {
                tokens.push({ type: 'bold', content: match[2] });
            } else {
                tokens.push({ type: 'italic', content: match[3] });
            }

            lastIndex = match.index + match[1].length;
        }

        if (lastIndex < input.length) {
            tokens.push({ type: 'text', content: input.slice(lastIndex) });
        }

        return tokens;
    };

    return text.split('\n').map((line) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('###')) {
            return { type: 'heading', content: applyMarkdown(trimmed.replace(/^###\s*/, '')) };
        } else if (trimmed.startsWith('•')) {
            return { type: 'bullet', content: applyMarkdown(trimmed.substring(1).trim()) };
        } else if (trimmed.toLowerCase().startsWith('remarque')) {
            return { type: 'remark', content: applyMarkdown(trimmed) };
        } else {
            return { type: 'text', content: applyMarkdown(trimmed) };
        }
    });
}

export default function IAParsedMessage({ text }) {
    const lines = parseMarkdown(text);

    return (
        <>
            {lines.map((line, index) => {
                let style = { fontSize: 15, color: '#333', marginBottom: 4 };

                if (line.type === 'remark') {
                    style = { fontSize: 14, color: '#666', fontStyle: 'italic', marginTop: 8 };
                } else if (line.type === 'heading') {
                    style = { fontSize: 17, fontWeight: 'bold', marginTop: 12, marginBottom: 6, color: '#222' };
                }

                return (
                    <Text key={index} style={style}>
                        {line.type === 'bullet' && <Text>• </Text>}
                        {line.content.map((part, idx) => {
                            if (part.type === 'bold') {
                                return (
                                    <Text key={idx} style={{ fontWeight: 'bold' }}>
                                        {part.content}
                                    </Text>
                                );
                            } else if (part.type === 'italic') {
                                return (
                                    <Text key={idx} style={{ fontStyle: 'italic' }}>
                                        {part.content}
                                    </Text>
                                );
                            } else {
                                return <Text key={idx}>{part.content}</Text>;
                            }
                        })}
                    </Text>
                );
            })}
        </>
    );
}
