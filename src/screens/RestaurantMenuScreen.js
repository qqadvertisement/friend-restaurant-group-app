import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../lib/supabaseClient';
import { authStyles } from '../styles/authStyles';

const MENU_IMAGES_BUCKET = 'menu-images';
const DEFAULT_IMAGE_ASPECT_RATIO = 3 / 4;

function MenuImage({ menu, restaurantName }) {
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_IMAGE_ASPECT_RATIO);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const handleLoad = (event) => {
    const { width, height } = event.nativeEvent.source ?? {};

    if (width > 0 && height > 0) {
      setAspectRatio(width / height);
    }
  };

  const handleError = () => {
    if (sourceIndex < menu.publicUrls.length - 1) {
      setSourceIndex((current) => current + 1);
      return;
    }

    setFailed(true);
  };

  if (failed) {
    return (
      <View style={authStyles.menuImageError}>
        <Text style={authStyles.errorMessageText}>Unable to load this menu image.</Text>
      </View>
    );
  }

  return (
    <Image
      key={menu.publicUrls[sourceIndex]}
      source={{ uri: menu.publicUrls[sourceIndex] }}
      style={[authStyles.menuImage, { aspectRatio }]}
      resizeMode="contain"
      onLoad={handleLoad}
      onError={handleError}
      accessibilityLabel={`${restaurantName} menu page ${menu.display_order}`}
    />
  );
}

function getMenuPathCandidates(imagePath, restaurantName) {
  const pathParts = imagePath.split('/');

  if (pathParts.length < 2) {
    return [imagePath];
  }

  const folderName = pathParts[0];
  const remainingPath = pathParts.slice(1);
  const pathCandidates = new Set([imagePath]);
  const capitalizedFolderName = `${folderName.charAt(0).toLocaleUpperCase()}${folderName.slice(
    1
  )}`;
  const matchingRestaurantWord = restaurantName
    .split(/\s+/)
    .find((word) => word.toLocaleLowerCase() === folderName.toLocaleLowerCase());

  pathCandidates.add([capitalizedFolderName, ...remainingPath].join('/'));

  if (matchingRestaurantWord) {
    pathCandidates.add([matchingRestaurantWord, ...remainingPath].join('/'));
  }

  return [...pathCandidates];
}

export default function RestaurantMenuScreen({ restaurantId, restaurantName, onBack }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadMenu = async () => {
      setLoading(true);
      setFailed(false);
      setMenuItems([]);

      if (!supabase || restaurantId == null) {
        if (isMounted) {
          setLoading(false);
          setFailed(true);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('menus')
          .select('id, restaurant_id, image_path, display_order')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) {
          throw error;
        }

        const menusWithPublicUrls = (data ?? []).map((menu) => {
          const publicUrls = getMenuPathCandidates(menu.image_path, restaurantName).map(
            (imagePath) => {
              const { data: publicUrlData } = supabase.storage
                .from(MENU_IMAGES_BUCKET)
                .getPublicUrl(imagePath);

              if (!publicUrlData?.publicUrl) {
                throw new Error(`Could not create a public URL for menu ${menu.id}.`);
              }

              return publicUrlData.publicUrl;
            }
          );

          return {
            ...menu,
            publicUrls,
          };
        });

        if (isMounted) {
          setMenuItems(menusWithPublicUrls);
        }
      } catch (error) {
        console.error(`Failed to load ${restaurantName} menu:`, error);

        if (isMounted) {
          setFailed(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMenu();

    return () => {
      isMounted = false;
    };
  }, [restaurantId, restaurantName]);

  return (
    <ScrollView contentContainerStyle={authStyles.menuScrollContent}>
      <View style={authStyles.formCard}>
        <Text style={authStyles.screenTitle}>{restaurantName} Menu</Text>

        {loading ? (
          <Text style={authStyles.successText}>Loading menu...</Text>
        ) : failed ? (
          <Text style={authStyles.errorMessageText}>Unable to load the menu.</Text>
        ) : menuItems.length === 0 ? (
          <Text style={authStyles.successText}>No active menu images are available.</Text>
        ) : (
          menuItems.map((menu) => (
            <View key={menu.id} style={authStyles.menuImageWrap}>
              <MenuImage menu={menu} restaurantName={restaurantName} />
            </View>
          ))
        )}

        <PrimaryButton title="Back" onPress={onBack} />
      </View>
    </ScrollView>
  );
}
