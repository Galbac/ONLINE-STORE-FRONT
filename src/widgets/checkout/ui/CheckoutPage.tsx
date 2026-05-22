import { cartApi } from "@/entities/cart";
import { deliveryApi } from "@/entities/delivery";
import { profileApi } from "@/entities/profile";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { CheckoutView } from "./CheckoutView";

export const CheckoutPage = async () => {
  const today = new Date().toISOString().slice(0, 10);

  const [cart, summary, addresses, deliveryOptions, pickupPoints] = await Promise.all([
    cartApi.get(),
    cartApi.getSummary(),
    profileApi.getAddresses(),
    deliveryApi.getOptions(),
    deliveryApi.getPickupPoints(),
  ]);

  const defaultAddress =
    addresses.items.find((address) => address.is_default) ?? addresses.items[0];
  const defaultPickupPoint = pickupPoints.items[0];

  const [deliveryCalculation, timeSlotsResponse] = await Promise.all([
    deliveryApi.calculate({
      delivery_type: "delivery",
      cart_total: summary.final_price,
      address_id: defaultAddress?.id ?? null,
      city: defaultAddress?.city ?? null,
    }),
    deliveryApi.getTimeSlots({
      date: today,
      delivery_type: "delivery",
      address_id: defaultAddress?.id ?? null,
      pickup_point_id: defaultPickupPoint?.id ?? null,
      city: defaultAddress?.city ?? defaultPickupPoint?.city ?? null,
    }),
  ]);

  return (
    <>
      <Header />
      <CheckoutView
        addresses={addresses}
        cart={cart}
        deliveryCalculation={deliveryCalculation}
        deliveryOptions={deliveryOptions}
        pickupPoints={pickupPoints}
        summary={summary}
        timeSlots={timeSlotsResponse}
      />
      <Footer />
    </>
  );
};
