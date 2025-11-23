import React from "react";
import { render, screen } from "@testing-library/react";
import PhotoCard from "../components/PhotoCard";

test("renders photo card", () => {
  const photo = { id: "1", title: "Test", url: "https://picsum.photos/seed/1/600/400" };
  render(<PhotoCard photo={photo as any} />);
  expect(screen.getByText("Test")).toBeInTheDocument();
});

test("shows photographer when provided", () => {
  const photo = { id: "2", title: "WithPhotographer", url: "https://picsum.photos/seed/2/600/400", photographer: "Me" };
  render(<PhotoCard photo={photo as any} />);
  expect(screen.getByText("Me")).toBeInTheDocument();
});
