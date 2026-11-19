import * as ImagePicker from "expo-image-picker";
import {
    AlertCircle,
    Award,
    BookOpen,
    ImagePlus,
    PenSquare,
    Search,
    User,
    X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../../services/api";

interface BlogPost {
  _id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  cropTag?: string;
  imageUrl?: string;
  authorName: string;
  authorRole: "Farmer" | "Expert";
  createdAt: string;
}

const CATEGORIES = [
  "All",
  "Crop Care",
  "Soil & Fertilizers",
  "Pest & Disease",
  "Irrigation",
  "Harvest & Storage",
] as const;

const PUBLISH_CATEGORIES = CATEGORIES.filter((c) => c !== "All");

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reader modal state
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  // Composer modal state
  const [composerOpen, setComposerOpen] = useState<boolean>(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("Crop Care");
  const [cropTag, setCropTag] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState<"Farmer" | "Expert">("Farmer");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setErrorMsg(null);
      setLoading(true);
      const res = await apiClient.get("/blogs", {
        params: {
          ...(selectedCategory !== "All" ? { category: selectedCategory } : {}),
          ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPosts(res.data.data);
      } else {
        setErrorMsg(res.data?.message || "Unable to load blogs.");
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || "Failed to fetch agriculture blogs.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePickImage = async () => {
    setFormError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError("Allow photo library access or paste an image URL below.");
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.7,
      base64: true,
    });

    if (!picked.canceled && picked.assets?.[0]) {
      const asset = picked.assets[0];
      if (asset.base64) {
        setImageUrl(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setImageUrl(asset.uri);
      }
    }
  };

  const resetComposer = () => {
    setTitle("");
    setSummary("");
    setContent("");
    setCategory("Crop Care");
    setCropTag("");
    setAuthorName("");
    setAuthorRole("Farmer");
    setImageUrl("");
    setFormError(null);
  };

  const handlePublish = async () => {
    setFormError(null);
    if (!title.trim() || !summary.trim() || !content.trim()) {
      setFormError("Please enter a title, short summary, and blog body.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post("/blogs", {
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        category,
        cropTag: cropTag.trim(),
        imageUrl: imageUrl.trim(),
        authorName: authorName.trim() || undefined,
        authorRole,
      });

      if (res.data?.success && res.data?.data) {
        setComposerOpen(false);
        resetComposer();
        await fetchPosts();
      } else {
        setFormError(res.data?.message || "Could not publish blog.");
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to publish blog.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      {/* Tab Header (No Back Button) */}
      <View className="bg-white px-5 py-3.5 border-b border-slate-200/80 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-extrabold text-slate-900">
            Explore & Field Blogs
          </Text>
          <Text className="text-xs text-slate-500">
            Insights from farmers & agricultural experts
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            resetComposer();
            setComposerOpen(true);
          }}
          activeOpacity={0.85}
          className="bg-emerald-700 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5"
        >
          <PenSquare size={15} color="#ffffff" />
          <Text className="text-xs font-extrabold text-white">Write</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Category Filter */}
      <View className="bg-white px-5 pt-3 pb-3.5 border-b border-slate-200/70 gap-3">
        <View className="bg-slate-100 rounded-xl px-3 py-2 flex-row items-center gap-2">
          <Search size={16} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search crops, pests, soil tips, authors..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-xs font-medium text-slate-900"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={15} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                  className={`px-3 py-1.5 rounded-full border ${
                    active
                      ? "bg-slate-900 border-slate-900"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      active ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Feed */}
      {loading ? (
        <View className="flex-1 items-center justify-center gap-2.5">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="text-xs font-bold text-slate-600">
            Loading agriculture stories...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {errorMsg && (
            <View className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex-row items-center gap-2">
              <AlertCircle size={16} color="#e11d48" />
              <Text className="text-xs font-semibold text-rose-800 flex-1">
                {errorMsg}
              </Text>
            </View>
          )}

          {posts.length === 0 ? (
            <View className="bg-white p-6 rounded-2xl border border-slate-200/80 items-center gap-2">
              <BookOpen size={24} color="#64748b" />
              <Text className="text-sm font-extrabold text-slate-900">
                No blogs found
              </Text>
              <Text className="text-xs text-slate-500 text-center">
                Try another topic or tap Write to share a field update or
                agronomy guide.
              </Text>
            </View>
          ) : (
            posts.map((post) => {
              const isExpert = post.authorRole === "Expert";
              return (
                <TouchableOpacity
                  key={post._id}
                  onPress={() => setActivePost(post)}
                  activeOpacity={0.85}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden"
                >
                  {post.imageUrl ? (
                    <Image
                      source={{ uri: post.imageUrl }}
                      resizeMode="cover"
                      className="w-full h-44 bg-slate-100"
                    />
                  ) : null}

                  <View className="p-4 gap-2.5">
                    {/* Category & Crop Tag */}
                    <View className="flex-row items-center justify-between gap-2">
                      <View className="flex-row items-center gap-2">
                        <View className="bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                          <Text className="text-[10px] font-extrabold text-emerald-800">
                            {post.category}
                          </Text>
                        </View>
                        {post.cropTag ? (
                          <View className="bg-slate-100 px-2.5 py-0.5 rounded-full">
                            <Text className="text-[10px] font-bold text-slate-600">
                              {post.cropTag}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <Text className="text-base font-extrabold text-slate-900 leading-snug">
                      {post.title}
                    </Text>

                    <Text
                      className="text-xs text-slate-600 leading-relaxed"
                      numberOfLines={2}
                    >
                      {post.summary}
                    </Text>

                    {/* Author Attribution */}
                    <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-100">
                      <View className="flex-row items-center gap-1.5">
                        {isExpert ? (
                          <Award size={14} color="#047857" />
                        ) : (
                          <User size={14} color="#64748b" />
                        )}
                        <Text className="text-xs font-bold text-slate-800">
                          {post.authorName}
                        </Text>
                        <View
                          className={`px-2 py-0.5 rounded-full ${
                            isExpert ? "bg-emerald-100" : "bg-slate-100"
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-extrabold ${
                              isExpert ? "text-emerald-900" : "text-slate-600"
                            }`}
                          >
                            {post.authorRole}
                          </Text>
                        </View>
                      </View>

                      <Text className="text-xs font-bold text-emerald-700">
                        Read
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Full Blog Reader Modal */}
      <Modal
        visible={!!activePost}
        animationType="slide"
        onRequestClose={() => setActivePost(null)}
      >
        {activePost && (
          <View style={{ paddingTop: insets.top }} className="flex-1 bg-white">
            <View className="px-5 py-3.5 border-b border-slate-200/80 flex-row items-center justify-between">
              <Text className="text-sm font-extrabold text-slate-900">
                {activePost.category}
              </Text>
              <TouchableOpacity
                onPress={() => setActivePost(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center"
              >
                <X size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                padding: 20,
                paddingBottom: 48,
                gap: 16,
              }}
            >
              {activePost.imageUrl ? (
                <Image
                  source={{ uri: activePost.imageUrl }}
                  resizeMode="cover"
                  className="w-full h-56 rounded-2xl bg-slate-100"
                />
              ) : null}

              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-slate-800">
                  By {activePost.authorName}
                </Text>
                <View className="bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-extrabold text-emerald-800">
                    {activePost.authorRole}
                  </Text>
                </View>
                {activePost.cropTag ? (
                  <Text className="text-xs font-semibold text-slate-500">
                    · {activePost.cropTag}
                  </Text>
                ) : null}
              </View>

              <Text className="text-xl font-extrabold text-slate-900 leading-snug">
                {activePost.title}
              </Text>

              <Text className="text-sm font-semibold text-slate-600 leading-relaxed">
                {activePost.summary}
              </Text>

              <View className="h-[1px] bg-slate-100 my-1" />

              <Text className="text-sm text-slate-800 leading-7">
                {activePost.content}
              </Text>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Write Blog Modal */}
      <Modal
        visible={composerOpen}
        animationType="slide"
        onRequestClose={() => setComposerOpen(false)}
      >
        <View style={{ paddingTop: insets.top }} className="flex-1 bg-slate-50">
          <View className="bg-white px-5 py-3.5 border-b border-slate-200/80 flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-slate-900">
              Publish Agriculture Blog
            </Text>
            <TouchableOpacity
              onPress={() => setComposerOpen(false)}
              className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center"
            >
              <X size={18} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}
          >
            {/* Author Role Selector */}
            <View className="gap-1.5">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Posting As
              </Text>
              <View className="flex-row gap-2.5">
                {(["Farmer", "Expert"] as const).map((role) => {
                  const active = authorRole === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setAuthorRole(role)}
                      className={`flex-1 py-2.5 rounded-xl border items-center ${
                        active
                          ? "bg-emerald-700 border-emerald-700"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-extrabold ${
                          active ? "text-white" : "text-slate-700"
                        }`}
                      >
                        {role === "Expert" ? "Agronomist / Expert" : "Farmer"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Author Name & Crop Tag */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 mb-1">
                  Your Name
                </Text>
                <TextInput
                  value={authorName}
                  onChangeText={setAuthorName}
                  placeholder="Optional"
                  className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 mb-1">
                  Crop Tag
                </Text>
                <TextInput
                  value={cropTag}
                  onChangeText={setCropTag}
                  placeholder="e.g. Wheat, Paddy"
                  className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900"
                />
              </View>
            </View>

            {/* Category */}
            <View className="gap-1.5">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Topic Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {PUBLISH_CATEGORIES.map((cat) => {
                    const active = category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl border ${
                          active
                            ? "bg-slate-900 border-slate-900"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            active ? "text-white" : "text-slate-700"
                          }`}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Blog Image Picker + URL */}
            <View className="gap-2">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Blog Photo (Optional)
              </Text>
              <TouchableOpacity
                onPress={handlePickImage}
                activeOpacity={0.8}
                className="bg-white border border-dashed border-emerald-400 rounded-2xl p-3.5 flex-row items-center justify-center gap-2"
              >
                <ImagePlus size={18} color="#047857" />
                <Text className="text-xs font-bold text-emerald-800">
                  Pick Field / Crop Image from Gallery
                </Text>
              </TouchableOpacity>

              <TextInput
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="Or paste image URL (https://...)"
                className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />

              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  resizeMode="cover"
                  className="w-full h-44 rounded-2xl bg-slate-100"
                />
              ) : null}
            </View>

            {/* Title, Summary & Full Content */}
            <View className="gap-1.5">
              <Text className="text-xs font-bold text-slate-700">Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Managing early leaf spot after rain"
                className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900"
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-bold text-slate-700">
                Short Summary
              </Text>
              <TextInput
                value={summary}
                onChangeText={setSummary}
                placeholder="1–2 line overview shown in the feed"
                multiline
                className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-bold text-slate-700">
                Full Blog Content
              </Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Share field observations, steps taken, weather/soil notes, or expert guidance..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs text-slate-900 min-h-[130px]"
              />
            </View>

            {formError && (
              <View className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex-row items-center gap-2">
                <AlertCircle size={16} color="#e11d48" />
                <Text className="text-xs font-semibold text-rose-800 flex-1">
                  {formError}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handlePublish}
              disabled={submitting}
              activeOpacity={0.85}
              className="bg-emerald-700 py-3.5 rounded-xl items-center justify-center"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-extrabold text-sm">
                  Publish Blog
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
