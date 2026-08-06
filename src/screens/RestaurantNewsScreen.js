import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../lib/supabaseClient';
import { authStyles } from '../styles/authStyles';

const NEWS_IMAGES_BUCKET = 'news_images';

function NewsImage({ imageUrl, title }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <View
        style={authStyles.newsImagePlaceholder}
        accessibilityLabel={`${title} news image unavailable`}
      >
        <Text style={authStyles.newsImagePlaceholderText}>Image unavailable</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={authStyles.newsImage}
      resizeMode="contain"
      onError={() => setFailed(true)}
      accessibilityLabel={`${title} news image`}
    />
  );
}

function formatNewsDate(value) {
  return new Date(value).toLocaleString();
}

export default function RestaurantNewsScreen({ restaurantId, restaurantName, onBack }) {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadNews = async () => {
      setLoading(true);
      setFailed(false);
      setNewsItems([]);

      if (!supabase || restaurantId == null) {
        if (isMounted) {
          setLoading(false);
          setFailed(true);
        }
        return;
      }

      try {
        const now = new Date().toISOString();

        const { data, error } = await supabase
          .from('restaurant_news')
          .select(`
            id,
            restaurant_id,
            title,
            content,
            image_path,
            published_at,
            expires_at
          `)
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .lte('published_at', now)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order('published_at', { ascending: false });

        if (error) {
          throw error;
        }

        const newsWithImageUrls = (data ?? []).map((newsItem) => {
          if (!newsItem.image_path) {
            return { ...newsItem, imageUrl: null };
          }

          const { data: publicUrlData } = supabase.storage
            .from(NEWS_IMAGES_BUCKET)
            .getPublicUrl(newsItem.image_path);

          return {
            ...newsItem,
            imageUrl: publicUrlData?.publicUrl ?? null,
          };
        });

        if (isMounted) {
          setNewsItems(newsWithImageUrls);
        }
      } catch (error) {
        console.error(`Failed to load news for ${restaurantName}:`, error);

        if (isMounted) {
          setFailed(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNews();

    return () => {
      isMounted = false;
    };
  }, [restaurantId, restaurantName]);

  return (
    <ScrollView contentContainerStyle={authStyles.newsScrollContent}>
      <View style={authStyles.formCard}>
        <Text style={authStyles.screenTitle}>{restaurantName} News</Text>

        {loading ? (
          <Text style={authStyles.successText}>Loading restaurant news...</Text>
        ) : failed ? (
          <Text style={authStyles.errorMessageText}>Unable to load restaurant news.</Text>
        ) : newsItems.length === 0 ? (
          <Text style={authStyles.successText}>No current news is available.</Text>
        ) : (
          newsItems.map((newsItem) => (
            <View key={newsItem.id} style={authStyles.newsCard}>
              <View style={authStyles.newsImageArea}>
                <NewsImage imageUrl={newsItem.imageUrl} title={newsItem.title} />
              </View>
              <View style={authStyles.newsCardContent}>
                <Text style={authStyles.newsTitle}>{newsItem.title}</Text>
                <Text style={authStyles.newsContent}>{newsItem.content}</Text>
                <Text style={authStyles.newsDate}>
                  Published: {formatNewsDate(newsItem.published_at)}
                </Text>
                {newsItem.expires_at ? (
                  <Text style={authStyles.newsDate}>
                    Expires: {formatNewsDate(newsItem.expires_at)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}

        <PrimaryButton title="Back" onPress={onBack} />
      </View>
    </ScrollView>
  );
}
