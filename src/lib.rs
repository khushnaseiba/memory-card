mod game;

use game::GameState;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Game {
    state: GameState,
}

#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Game {
        Game {
            state: GameState::new(),
        }
    }

    pub fn card_count(&self) -> u32 {
        self.state.card_count()
    }

    pub fn card_value(&self, index: u32) -> u32 {
        self.state.card_value(index) as u32
    }

    pub fn is_face_up(&self, index: u32) -> bool {
        self.state.is_face_up(index)
    }

    pub fn is_matched(&self, index: u32) -> bool {
        self.state.is_matched(index)
    }

    pub fn current_player(&self) -> u32 {
        self.state.current_player() as u32
    }

    pub fn score(&self, player: u32) -> u32 {
        self.state.score(player) as u32
    }

    pub fn matched_pairs(&self) -> u32 {
        self.state.matched_pairs() as u32
    }

    pub fn is_game_over(&self) -> bool {
        self.state.is_game_over()
    }

    pub fn flip(&mut self, index: u32) -> u32 {
        self.state.flip(index) as u32
    }

    pub fn resolve_mismatch(&mut self) {
        self.state.resolve_mismatch();
    }
}
