import { cartApi, fallbackCart, fallbackCartSummary } from "@/entities/cart";
import {
  deliveryApi,
  fallbackDeliveryCalculate,
  fallbackDeliveryOptions,
  fallbackDeliveryTimeSlots,
  fallbackPickupPoints,
} from "@/entities/delivery";
import { fallbackAddresses, profileApi } from "@/entities/profile";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { CheckoutView } from "./CheckoutView";

export const CheckoutPage = async () => {
  const today = new Date().toISOString().slice(0, 10);

  const [cart, summary, addresses, deliveryOptions, pickupPoints] = await Promise.all([
    cartApi.get().catch(() => fallbackCart),
    cartApi.getSummary().catch(() => fallbackCartSummary),
    profileApi.getAddresses().catch(() => fallbackAddresses),
    deliveryApi.getOptions().catch(() => fallbackDeliveryOptions),
    deliveryApi.getPickupPoints().catch(() => fallbackPickupPoints),
  ]);

  const visibleAddresses = addresses.items.length > 0 ? addresses : fallbackAddresses;
  const visiblePickupPoints = pickupPoints.items.length > 0 ? pickupPoints : fallbackPickupPoints;
  const defaultAddress =
    visibleAddresses.items.find((address) => address.is_default) ?? visibleAddresses.items[0];
  const defaultPickupPoint = visiblePickupPoints.items[0];

  const [deliveryCalculation, timeSlotsResponse] = await Promise.all([
    deliveryApi
      .calculate({
        delivery_type: "delivery",
        cart_total: summary.final_price,
        address_id: defaultAddress?.id ?? null,
        city: defaultAddress?.city ?? "Москва",
      })
      .catch(() => fallbackDeliveryCalculate),
    deliveryApi
      .getTimeSlots({
        date: today,
        delivery_type: "delivery",
        address_id: defaultAddress?.id ?? null,
        pickup_point_id: defaultPickupPoint?.id ?? null,
        city: defaultAddress?.city ?? defaultPickupPoint?.city ?? "Москва",
      })
      .catch(() => ({
        ...fallbackDeliveryTimeSlots,
        date: today,
      })),
  ]);
  const timeSlots =
    timeSlotsResponse.items.length > 0
      ? timeSlotsResponse
      : {
          ...fallbackDeliveryTimeSlots,
          date: today,
        };

  return (
    <>
      <Header />
      <CheckoutView
        addresses={visibleAddresses}
        cart={cart}
        deliveryCalculation={deliveryCalculation}
        deliveryOptions={deliveryOptions}
        pickupPoints={visiblePickupPoints}
        summary={summary}
        timeSlots={timeSlots}
      />
      <Footer />
    </>
  );
};
