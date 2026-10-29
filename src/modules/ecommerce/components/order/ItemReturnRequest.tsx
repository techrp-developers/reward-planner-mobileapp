import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary } from "react-native-image-picker";

import OrderHeading from "../../constants/heading/OrderHeading";
import OrderItemCard from "../../../common/order/OrderItemCard";
import Product from "../../../../assets/product/product(1).svg";
import { HomeStackParamList } from "../../navigation/types";
import { requestItemReturn, ReturnEvidenceVideo, ReturnRequestType } from "../../api/OrderApi";
import { useAppTheme } from "../../../../theme/ThemeContext";

type RouteProps = RouteProp<HomeStackParamList, "ItemReturnRequest">;
type Nav = NativeStackNavigationProp<HomeStackParamList>;

// Must match returnEvidenceUpload.js on the server.
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_REASON_LENGTH = 2000;
const VIDEO_MIME_BY_EXTENSION: Record<string, string> = {
    mp4: "video/mp4",
    m4v: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
};
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

type PickedVideo = ReturnEvidenceVideo & { fileSize?: number; duration?: number };

const resolveVideoType = (type?: string, fileName?: string) => {
    if (type && ALLOWED_VIDEO_TYPES.includes(type)) return type;
    const extension = fileName?.split(".").pop()?.toLowerCase() || "";
    return VIDEO_MIME_BY_EXTENSION[extension];
};

const formatSize = (bytes?: number) =>
    bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : "";

const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const total = Math.round(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

const formatDisplayDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

export default function ItemReturnRequest() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<RouteProps>();
    const { isDark, theme } = useAppTheme();

    const { orderItemId, orderId, orderRef, productTitle, productMeta, canReturn, canReplace, windowEndsAt } =
        route.params;

    const [type, setType] = useState<ReturnRequestType>(canReplace && !canReturn ? "replacement" : "return");
    const [reason, setReason] = useState("");
    const [video, setVideo] = useState<PickedVideo | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const videoRequired = type === "replacement";
    const isSubmitDisabled =
        submitting || reason.trim().length === 0 || (videoRequired && !video);
    const windowEndText = formatDisplayDate(windowEndsAt);

    const pickVideo = async () => {
        const result = await launchImageLibrary({
            mediaType: "video",
            selectionLimit: 1,
            videoQuality: "medium",
        });
        if (result.didCancel) return;
        if (result.errorCode) {
            Alert.alert("Unable to open gallery", result.errorMessage || "Please try again.");
            return;
        }

        const asset = result.assets?.[0];
        if (!asset?.uri) return;

        const videoType = resolveVideoType(asset.type, asset.fileName);
        if (!videoType) {
            Alert.alert("Unsupported video", "Please choose an MP4, MOV or WebM video.");
            return;
        }
        if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
            Alert.alert("Video too large", "The video must be 50 MB or smaller. Try a shorter clip.");
            return;
        }

        setVideo({
            uri: asset.uri,
            type: videoType,
            fileName: asset.fileName,
            fileSize: asset.fileSize,
            duration: asset.duration,
        });
    };

    const handleSubmit = async () => {
        if (isSubmitDisabled) return;

        try {
            setSubmitting(true);
            const res = await requestItemReturn(Number(orderItemId), {
                request_type: type,
                reason: reason.trim(),
                video,
            });

            if (res?.success) {
                Alert.alert(
                    "Request submitted",
                    `Your ${type} request has been sent to the seller for review.`,
                    [{ text: "OK", onPress: () => navigation.goBack() }]
                );
                return;
            }

            Alert.alert("Request failed", res?.message || "Unable to submit request");
        } finally {
            setSubmitting(false);
        }
    };

    const renderTypeOption = (value: ReturnRequestType, label: string, hint: string, enabled: boolean) => {
        if (!enabled) return null;
        const selected = type === value;
        return (
            <TouchableOpacity
                key={value}
                style={styles.reasonRow}
                activeOpacity={0.7}
                onPress={() => setType(value)}
            >
                <View style={[styles.radioOuter, { borderColor: theme.border }, selected && styles.radioOuterActive]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={styles.flex}>
                    <Text style={[styles.reasonText, { color: theme.text }]}>{label}</Text>
                    <Text style={[styles.hintText, { color: theme.secondaryText }]}>{hint}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <OrderHeading title="Return / Replace Item" onBackPress={() => navigation.goBack()} isDark={isDark} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <OrderItemCard
                    image={<Product width={48} height={48} />}
                    title={productTitle || "Product"}
                    weight={productMeta || "-"}
                    orderId={String(orderRef || orderId)}
                />

                {windowEndText ? (
                    <Text style={[styles.windowText, { color: theme.secondaryText }]}>
                        Requests are open until {windowEndText}
                    </Text>
                ) : null}

                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>What would you like to do?</Text>
                    {renderTypeOption("return", "Return item", "Send it back for a refund", canReturn)}
                    {renderTypeOption(
                        "replacement",
                        "Replace item",
                        "Get a new one — a video of the damage is required",
                        canReplace
                    )}
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Reason*</Text>
                    <TextInput
                        placeholder={
                            videoRequired
                                ? "Describe the damage or defect"
                                : "Tell us why you're returning this item"
                        }
                        placeholderTextColor={theme.secondaryText}
                        value={reason}
                        onChangeText={setReason}
                        maxLength={MAX_REASON_LENGTH}
                        multiline
                        style={[
                            styles.commentInput,
                            {
                                color: theme.text,
                                backgroundColor: isDark ? "#111827" : "#FFFFFF",
                                borderColor: theme.border,
                            },
                        ]}
                    />
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                        {videoRequired ? "Damage video*" : "Video (optional)"}
                    </Text>
                    <Text style={[styles.hintText, { color: theme.secondaryText, marginBottom: 12 }]}>
                        {videoRequired
                            ? "Upload a clear video showing the damaged product and its packaging. MP4, MOV or WebM, up to 50 MB."
                            : "You can add a video showing the product's condition. MP4, MOV or WebM, up to 50 MB."}
                    </Text>

                    {video ? (
                        <View style={[styles.videoRow, { borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="file-video-outline" size={28} color={theme.primary} />
                            <View style={styles.flex}>
                                <Text style={[styles.reasonText, { color: theme.text }]} numberOfLines={1}>
                                    {video.fileName || "Selected video"}
                                </Text>
                                <Text style={[styles.hintText, { color: theme.secondaryText }]}>
                                    {[formatDuration(video.duration), formatSize(video.fileSize)].filter(Boolean).join("  •  ")}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setVideo(null)} hitSlop={8} accessibilityLabel="Remove video">
                                <MaterialCommunityIcons name="close-circle" size={22} color={theme.secondaryText} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.uploadButton, { borderColor: theme.primary }]}
                            activeOpacity={0.8}
                            onPress={pickVideo}
                        >
                            <MaterialCommunityIcons name="video-plus-outline" size={22} color={theme.primary} />
                            <Text style={[styles.uploadText, { color: theme.primary }]}>Choose video</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity activeOpacity={0.9} disabled={isSubmitDisabled} onPress={handleSubmit}>
                    <LinearGradient
                        colors={["#8665FF", "#5B47A3"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.submitButton, isSubmitDisabled && styles.disabledButton]}
                    >
                        <Text style={styles.submitText}>
                            {submitting
                                ? video
                                    ? "Uploading..."
                                    : "Submitting..."
                                : `Request ${type === "return" ? "Return" : "Replacement"}`}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    windowText: {
        fontSize: 12,
        marginTop: 10,
        textAlign: "center",
    },
    card: {
        marginTop: 16,
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 8,
    },
    reasonRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
    },
    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    radioOuterActive: {
        borderColor: "#6D5AE6",
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#6D5AE6",
    },
    reasonText: {
        fontSize: 13,
        fontWeight: "600",
    },
    hintText: {
        fontSize: 12,
        marginTop: 2,
        lineHeight: 17,
    },
    commentInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        minHeight: 90,
        textAlignVertical: "top",
    },
    uploadButton: {
        height: 48,
        borderRadius: 10,
        borderWidth: 1.5,
        borderStyle: "dashed",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    uploadText: {
        fontSize: 14,
        fontWeight: "700",
    },
    videoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
    },
    submitButton: {
        height: 52,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 24,
    },
    submitText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    disabledButton: {
        opacity: 0.5,
    },
});
